import React, { useState, useRef } from 'react';
import { uploadDocument, requestAnalysis, getAnalysisStatus } from '../api/client';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

type Step = 'upload' | 'processing' | 'completed' | 'failed';

interface AnalysisResult {
  patient_name: string;
  birth_date: string;
  age: number;
  gender: string;
  diagnosis: string;
  hospital_name: string;
  doctor_name: string;
  visit_date: string;
  summary: string;
  medication_guide: string;
  lifestyle_guide: string;
  warning_signs: string;
}

export default function PrescriptionAnalysis() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [guideResultId, setGuideResultId] = useState<number | null>(null);
  const [currentSymptom, setCurrentSymptom] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError(null);
  };

  const pollStatus = async (id: number) => {
    const maxAttempts = 30;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await getAnalysisStatus(id);
        if (data.status === 'completed') {
          clearInterval(interval);
          setResult(data);
          setStep('completed');
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError(data.error || '분석에 실패했습니다.');
          setStep('failed');
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError('분석 시간이 초과되었습니다. 다시 시도해주세요.');
          setStep('failed');
        }
      } catch {
        clearInterval(interval);
        setError('상태 확인 중 오류가 발생했습니다.');
        setStep('failed');
      }
    }, 2000);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setError(null);
    setStep('processing');
    try {
      const uploadData = await uploadDocument(selectedFile);
      setOcrText(uploadData.extracted_text);
      const analysisData = await requestAnalysis(uploadData.document_id, currentSymptom);
      setGuideResultId(analysisData.guide_result_id);
      await pollStatus(analysisData.guide_result_id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다.';
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || message);
      setStep('failed');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setOcrText(null);
    setGuideResultId(null);
  };

  const chatQuestions = [
    '이 약 부작용이 있나요?',
    '음식 주의사항 알려줘',
    '약을 빠뜨렸을 때 어떻게 하나요?',
  ];

  const goodExamples = [
    { icon: '🏥', text: '병원 발급 처방전' },
    { icon: '💊', text: '약국 조제 영수증' },
    { icon: '📋', text: '진료 확인서' },
    { icon: '🔍', text: '글씨가 선명한 사진' },
  ];
  const badExamples = [
    { icon: '🌫️', text: '흐릿하거나 초점 안 맞는 사진' },
    { icon: '✂️', text: '일부가 잘린 문서' },
    { icon: '🔆', text: '빛 반사로 글씨가 안 보이는 사진' },
    { icon: '📝', text: '손으로 쓴 메모' },
  ];

  return (
    <AppLayout>
      <div className="py-8 px-6">
        <div className="max-w-3xl mx-auto">

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">처방전 AI 분석</h1>
            <p className="text-gray-500 mt-1">
              처방전 이미지를 업로드하면 AI가 약물 정보와 생활 가이드를 분석해드려요.
            </p>
          </div>

          {/* 현재 증상/수술명 입력 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현재 증상 또는 수술명 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={currentSymptom}
              onChange={(e) => setCurrentSymptom(e.target.value)}
              placeholder="예: 오른쪽 무릎 반월판 수술, 허리 디스크..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* STEP 1: 업로드 */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm p-6">

                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="미리보기"
                      className="max-h-64 mx-auto rounded-lg object-contain"
                    />
                  ) : (
                    <>
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-gray-600 font-medium">클릭하거나 파일을 드래그하세요</p>
                      <p className="text-gray-400 text-sm mt-1">JPG, PNG, WEBP, PDF · 최대 10MB</p>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {selectedFile && (
                  <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                    <span className="text-sm text-blue-700 font-medium truncate">
                      {selectedFile.name}
                    </span>
                    <button
                      onClick={() => { setSelectedFile(null); setPreview(null); }}
                      className="text-gray-400 hover:text-red-500 ml-2 text-lg"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {error && (
                  <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
                )}

                <button
                  onClick={() => void handleAnalyze()}
                  disabled={!selectedFile}
                  className="mt-5 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base"
                >
                  AI 분석 시작
                </button>
              </div>

              {/* 가능 / 불가능 예시 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✅</span>
                    <p className="font-semibold text-green-700">이런 건 잘 돼요</p>
                  </div>
                  <ul className="space-y-2">
                    {goodExamples.map(ex => (
                      <li key={ex.text} className="flex items-center gap-2 text-sm text-green-700">
                        <span>{ex.icon}</span>
                        <span>{ex.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">❌</span>
                    <p className="font-semibold text-red-600">이런 건 인식이 어려워요</p>
                  </div>
                  <ul className="space-y-2">
                    {badExamples.map(ex => (
                      <li key={ex.text} className="flex items-center gap-2 text-sm text-red-600">
                        <span>{ex.icon}</span>
                        <span>{ex.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 분석 중 */}
          {step === 'processing' && (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <div className="text-6xl mb-4 animate-bounce">🔍</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">AI가 분석 중이에요</h2>
              <p className="text-gray-500 mb-6">
                처방전을 읽고 약물 정보와 생활 가이드를 생성하고 있어요.<br />
                보통 30초~1분 정도 걸려요.
              </p>
              {ocrText && (
                <div className="bg-gray-50 rounded-xl p-4 text-left mt-4">
                  <p className="text-xs text-gray-400 font-medium mb-2">📝 OCR 인식 결과</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-4">{ocrText}</p>
                </div>
              )}
              <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full animate-pulse"
                  style={{ width: '70%' }}
                />
              </div>
            </div>
          )}

          {/* STEP 3: 완료 */}
          {step === 'completed' && result && (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏥</span> 진료 정보
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '환자명', value: result.patient_name },
                    { label: '생년월일', value: result.birth_date },
                    { label: '나이', value: result.age ? `${result.age}세` : '' },
                    { label: '성별', value: result.gender },
                    { label: '진단명', value: result.diagnosis },
                    { label: '병원명', value: result.hospital_name },
                    { label: '담당의', value: result.doctor_name },
                    { label: '진료일', value: result.visit_date },
                  ].map(({ label, value }) =>
                    value ? (
                      <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-xs text-gray-400 mb-1">{label}</p>
                        <p className="text-sm font-semibold text-gray-700">{value}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📋</span> 분석 요약
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.summary}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>💊</span> 약물 복용 가이드
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.medication_guide}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>🏃</span> 생활 습관 가이드
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.lifestyle_guide}
                </p>
              </div>

              <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                <h3 className="font-bold text-red-700 mb-3 flex items-center gap-2">
                  <span>⚠️</span> 주의해야 할 증상
                </h3>
                <p className="text-red-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {result.warning_signs}
                </p>
              </div>

              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-400 mb-3 text-center tracking-wide">
                  — 다음 단계로 이동하세요 —
                </p>
                <div className="space-y-3">
                  <div
                    onClick={() => navigate('/chat', { state: { guide_id: guideResultId } })}
                    className="bg-blue-50 border border-blue-200 rounded-2xl p-5 cursor-pointer hover:bg-blue-100 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">💬</span>
                      <span className="font-semibold text-blue-700 text-base">
                        AI 챗봇에게 질문하기
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      이 처방전에 대해 더 궁금한 게 있으신가요?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {chatQuestions.map((q) => (
                        <span
                          key={q}
                          className="bg-white border border-blue-200 text-blue-600 text-xs px-3 py-1 rounded-full shadow-sm"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-semibold text-gray-700 text-sm">대시보드로 돌아가기</div>
                      <div className="text-xs text-gray-400 mt-1">분석 이력 확인</div>
                    </button>
                    <button
                      onClick={handleReset}
                      className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:bg-gray-50 transition-all shadow-sm"
                    >
                      <div className="text-2xl mb-2">🔄</div>
                      <div className="font-semibold text-gray-700 text-sm">새 처방전 분석</div>
                      <div className="text-xs text-gray-400 mt-1">다른 처방전 업로드</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 실패 */}
          {step === 'failed' && (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <div className="text-5xl mb-4">😢</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">분석에 실패했어요</h2>
              <p className="text-red-500 text-sm mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
              >
                다시 시도하기
              </button>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
