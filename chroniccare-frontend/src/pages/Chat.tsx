import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';

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
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const guideId = (location.state as { guide_id?: number })?.guide_id ?? null;

  useEffect(() => {
    apiClient.get('/api/v1/chat/sessions')
      .then(res => setSessions(res.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSession = async (sessionId: number) => {
    setCurrentSessionId(sessionId);
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

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiClient.post('/api/v1/chat', {
        message: text,
        session_id: currentSessionId,
        guide_id: guideId,
      });

      const { session_id, message } = res.data;
      setCurrentSessionId(session_id);
      setMessages(prev => [...prev, { role: 'assistant', content: message }]);

      setSessions(prev => {
        const exists = prev.find(s => s.session_id === session_id);
        if (!exists) {
          return [{
            session_id,
            context_type: 'general',
            session_status: 'active',
            started_at: new Date().toISOString()
          }, ...prev];
        }
        return prev;
      });
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '오류가 발생했어요. 다시 시도해주세요.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
  };

  const quickQuestions = [
    '처방받은 약의 부작용이 궁금해요',
    '운동할 때 주의사항이 있나요?',
    '식이요법 추천해주세요',
    '증상이 심해지면 어떻게 하나요?',
  ];

  return (
    <AppLayout>
      <div className="flex h-full">

        {/* 세션 목록 패널 */}
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
              <button
                key={s.session_id}
                onClick={() => void loadSession(s.session_id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                  currentSessionId === s.session_id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                <p className="truncate">💬 세션 #{s.session_id}</p>
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(s.started_at).toLocaleDateString('ko-KR')}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* 채팅 영역 */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* 채팅 헤더 */}
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

            {messages.length === 0 && (
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
                placeholder="건강 관련 질문을 입력하세요... (Shift+Enter: 줄바꿈)"
                rows={1}
                className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 max-h-32"
              />
              <button
                onClick={() => void handleSend()}
                disabled={!input.trim() || loading}
                className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                전송
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
