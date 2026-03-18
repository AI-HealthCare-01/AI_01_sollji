import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';
import { useAuthStore } from '../store/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  session_id: number;
  context_type: string;
  session_status: string;
  started_at: string;
}

export default function Chat() {
  const location = useLocation();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);           // 첫 토큰 대기 중
  const [streamingContent, setStreamingContent] = useState(''); // 스트리밍 누적 텍스트
  const [deletingSessionId, setDeletingSessionId] = useState<number | null>(null);
  const token = useAuthStore(state => state.token);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 현재 세션 ID를 ref로도 관리 (클로저 문제 방지)
  const currentSessionIdRef = useRef<number | null>(null);

  const guideId = (location.state as { guide_id?: number })?.guide_id ?? null;

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q'); // searchParams 대신
    if (q && q.trim()) {
      const timer = setTimeout(() => {
        void handleSend(q.trim());
      }, 300);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    apiClient.get('/api/v1/chat/sessions')
      .then(res => setSessions(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]); // streamingContent 변경 시도 스크롤

  const loadSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
    currentSessionIdRef.current = sessionId;
    try {
      const res = await apiClient.get(`/api/v1/chat/sessions/${sessionId}/messages`);
      setMessages(res.data.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })));
    } catch {
      setMessages([]);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    if (!window.confirm('이 대화를 삭제할까요?')) return;

    setDeletingSessionId(sessionId);
    try {
      await apiClient.delete(`/api/v1/chat/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.session_id !== sessionId));
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
        currentSessionIdRef.current = null;
        setMessages([]);
      }
    } catch {
      alert('삭제에 실패했어요.');
    } finally {
      setDeletingSessionId(null);
    }
  };

  // 스트리밍 방식으로 메시지 전송
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading || streamingContent) return;

    // 1. 사용자 메시지 즉시 표시
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);       // 바운싱 점 표시 시작
    setStreamingContent(''); // 스트리밍 초기화

    // 2. JWT 토큰 가져오기
    if (!token) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '로그인이 필요합니다.'
      }]);
      setLoading(false);
      return;
    }

    try {
      // 3. fetch로 스트리밍 엔드포인트 호출
      //    Axios는 스트리밍 미지원이라 fetch 직접 사용
      const response = await fetch(
        `${import.meta.env.VITE_API_URL ?? ''}/api/v1/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text,
            session_id: currentSessionIdRef.current,
            guide_id: guideId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      // 4. 스트림 읽기 시작
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = ''; // 이번 응답 전체 누적

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const token = line.replace('data: ', '');

          // 완료 신호
          if (token === '[DONE]') {
            // 스트리밍 완료 → 정식 메시지로 확정
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: accumulated,
            }]);
            setStreamingContent('');
            break;
          }

          // 에러 신호
          if (token.startsWith('[ERROR]')) {
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: '오류가 발생했어요. 다시 시도해주세요.',
            }]);
            setStreamingContent('');
            break;
          }

          // [SESSION_ID:숫자] 처리
          if (token.startsWith('[SESSION_ID:')) {
            const sid = parseInt(token.replace('[SESSION_ID:', '').replace(']', ''));
            setCurrentSessionId(sid);
            currentSessionIdRef.current = sid;
            setSessions(prev => {
              const exists = prev.find(s => s.session_id === sid);
              if (!exists) {
                return [{
                  session_id: sid,
                  context_type: guideId ? 'guide' : 'general',
                  session_status: 'ACTIVE',
                  started_at: new Date().toISOString(),
                }, ...prev];
              }
              return prev;
            });
            continue; // ← 이 토큰은 화면에 표시하지 않고 건너뜀
          }

          // 첫 토큰 도착 → 바운싱 점 숨기기
          if (loading) {
            setLoading(false);
          }

          // 토큰 누적 (백엔드에서 \n을 \\n으로 이스케이프했으므로 복원)
          const cleanToken = token.replace(/\\n/g, '\n');
          accumulated += cleanToken;
          setStreamingContent(accumulated);
        }
      }

    } catch {
      setLoading(false);
      setStreamingContent('');
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '오류가 발생했어요. 다시 시도해주세요.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    currentSessionIdRef.current = null;
    setMessages([]);
    setStreamingContent('');
  };

  const quickQuestions = [
    '처방받은 약의 부작용이 궁금해요',
    '운동할 때 주의사항이 있나요?',
    '식이요법 추천해주세요',
    '증상이 심해지면 어떻게 하나요?',
  ];

  // 스트리밍 중인지 여부 (입력 비활성화 판단용)
  const isStreaming = streamingContent.length > 0;

  return (
    <AppLayout>
      <div className="flex h-full">

        {/* 세션 목록 패널 — 변경 없음 */}
        <div className="w-52 bg-white border-r flex flex-col flex-shrink-0">
          <div className="p-4 border-b flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-600">대화 목록</p>
            <button
              onClick={handleNewChat}
              className="text-xs text-blue-500 hover:underline"
            >
              + 새 대화
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 && (
              <p className="text-xs text-gray-300 px-2 py-3 text-center">대화 기록이 없어요</p>
            )}
            {sessions.map(s => (
              <div
                key={s.session_id}
                className={`group relative w-full rounded-xl transition-all ${
                  currentSessionId === s.session_id
                    ? 'bg-blue-100'
                    : 'hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => void loadSession(s.session_id)}
                  className="w-full text-left px-3 py-2.5 text-sm pr-8"
                >
                  <p className={`truncate ${
                    currentSessionId === s.session_id
                      ? 'text-blue-700 font-medium'
                      : 'text-gray-500'
                  }`}>
                    💬 세션 #{s.session_id}
                  </p>
                  <p className="text-xs text-gray-300 mt-0.5">
                    {new Date(s.started_at).toLocaleDateString('ko-KR')}
                  </p>
                </button>
                <button
                  onClick={e => void handleDeleteSession(e, s.session_id)}
                  disabled={deletingSessionId === s.session_id}
                  className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 disabled:opacity-30 p-1 rounded-lg hover:bg-red-50"
                  title="대화 삭제"
                >
                  {deletingSessionId === s.session_id ? '...' : '🗑'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* 헤더 — 변경 없음 */}
          <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-lg font-bold text-gray-800">🤖 AI 건강 상담</h2>
              <p className="text-xs text-gray-400">
                {guideId ? `처방전 #${guideId} 기반 상담 중` : '건강에 관한 무엇이든 물어보세요'}
              </p>
            </div>
            {currentSessionId && (
              <button
                onClick={handleNewChat}
                className="text-sm text-blue-500 hover:underline"
              >
                + 새 대화 시작
              </button>
            )}
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

            {messages.length === 0 && !streamingContent && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-5xl mb-4">🤖</div>
                <p className="text-gray-600 font-semibold text-lg mb-1">무엇이든 물어보세요</p>
                <p className="text-gray-400 text-sm mb-8">
                  건강, 약물, 재활, 생활습관 모두 상담 가능해요
                </p>
                <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                  {quickQuestions.map(q => (
                    <button
                      key={q}
                      onClick={() => void handleSend(q)}
                      className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all text-left shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 확정된 메시지들 */}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-700 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* ★ 스트리밍 중인 메시지 (타이핑 효과) */}
            {streamingContent && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
                  🤖
                </div>
                <div className="max-w-[70%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm leading-relaxed whitespace-pre-wrap bg-white text-gray-700 shadow-sm">
                  {streamingContent}
                  {/* 커서 깜빡임 효과 */}
                  <span className="inline-block w-0.5 h-4 bg-blue-400 ml-0.5 animate-pulse align-middle" />
                </div>
              </div>
            )}

            {/* 첫 토큰 대기 중 바운싱 점 (기존과 동일) */}
            {loading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm mr-2 flex-shrink-0">
                  🤖
                </div>
                <div className="bg-white shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* 입력창 */}
          <div className="bg-white border-t px-6 py-4 flex-shrink-0">
            <div className="flex gap-3 items-end">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder={
                  isStreaming
                    ? 'AI가 답변 중입니다...'
                    : '건강 관련 질문을 입력하세요... (Shift+Enter: 줄바꿈)'
                }
                rows={1}
                disabled={isStreaming} // 스트리밍 중 입력 비활성화
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 max-h-32 disabled:bg-gray-50 disabled:text-gray-400"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading || isStreaming}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                {isStreaming ? '...' : '전송'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
