import React, { useState, useRef } from 'react';
import { uploadDocument, requestAnalysis, getAnalysisStatus } from '../api/client';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';

type Step = 'upload' | 'processing' | 'completed' | 'failed';

interface DrugInteraction {
  medication_a: string;
  medication_b: string;
  interaction_type: string;
  severity: 'high' | 'medium' | 'low';
  mechanism: string;
  recommendation: string;
}

interface MedicationItem {
  name: string;
  times: string[];
  with_food: boolean;
  duration_days?: number;
}

interface MedicationScheduleDate {
  // 구조 1: medications 배열
  medications?: MedicationItem[];
  duration_days?: number;
  // 구조 2: 개별 약품 필드
  drug_name?: string;
  times?: string[];
  with_food?: boolean;
}

interface MedicationSchedule {
  schedule_date: MedicationScheduleDate;
}

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
  drug_interactions?: DrugInteraction[];
  medication_schedules?: MedicationSchedule[];
}

const BODY_PARTS = ['손목/손', '어깨', '허리', '무릎/다리', '발목', '기타'];
const SITUATIONS = ['골절/뼈 부상', '수술 후', '만성 통증', '근육 부상'];

const RECOMMENDED_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '13:00', '19:00'],
  4: ['08:00', '12:00', '17:00', '21:00'],
  5: ['07:00', '10:00', '13:00', '17:00', '21:00'],
  6: ['07:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
};

const TIME_PERIOD: Record<string, string> = {
  '06:00': '새벽', '07:00': '아침', '08:00': '아침',
  '09:00': '오전', '10:00': '오전', '11:00': '오전',
  '12:00': '점심', '13:00': '점심', '14:00': '오후',
  '15:00': '오후', '16:00': '오후', '17:00': '저녁',
  '18:00': '저녁', '19:00': '저녁', '20:00': '밤',
  '21:00': '밤', '22:00': '밤',
};

function calcAge(birthDate: string): number {
  if (!birthDate) return 0;
  let year: number;
  if (birthDate.length === 6) {
    const yy = parseInt(birthDate.slice(0, 2));
    year = yy > 30 ? 1900 + yy : 2000 + yy; // 30 기준으로 세기 구분
  } else {
    year = new Date(birthDate).getFullYear();
  }
  return new Date().getFullYear() - year;
}

// 진단명 공백 정규화 (OCR 오류 방어: "M 5 1 . 1" → "M51.1")
function normalizeDiagnosis(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\s+/g, '').replace(/([A-Z])(\d)/g, '$1$2');
}

function getRecommendedTimes(count: number): string[] {
  return RECOMMENDED_TIMES[count] ?? RECOMMENDED_TIMES[3];
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; className: string }> = {
    high:   { label: '높음', className: 'bg-red-100 text-red-700 border border-red-200' },
    medium: { label: '중간', className: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
    low:    { label: '낮음', className: 'bg-green-100 text-green-700 border border-green-200' },
  };
  const { label, className } = map[severity] ?? map['low'];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  );
}

function CheckChip({
  label, isChecked, onClick, color,
}: {
  label: string;
  isChecked: boolean;
  onClick: () => void;
  color: 'blue' | 'indigo';
}) {
  const activeClass = color === 'blue'
    ? 'bg-blue-600 text-white border-blue-600'
    : 'bg-indigo-600 text-white border-indigo-600';
  const hoverClass = color === 'blue'
    ? 'hover:border-blue-400 hover:text-blue-500'
    : 'hover:border-indigo-400 hover:text-indigo-500';
  const checkColor = color === 'blue' ? 'text-blue-600' : 'text-indigo-600';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-base font-medium border-2 transition-all ${
        isChecked ? activeClass : `bg-white text-gray-600 border-gray-200 ${hoverClass}`
      }`}
    >
      <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
        isChecked ? 'bg-white border-white' : 'border-gray-400'
      }`}>
        {isChecked && (
          <svg className={`w-3 h-3 ${checkColor}`} fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {label}
    </button>
  );
}

export default function PrescriptionAnalysis() {
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [guideResultId, setGuideResultId] = useState<number | null>(null);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [selectedSituations, setSelectedSituations] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const togglePart = (v: string) =>
    setSelectedParts(prev => prev.includes(v) ? prev.filter(s => s !== v) : [...prev, v]);
  const toggleSituation = (v: string) =>
    setSelectedSituations(prev => prev.includes(v) ? prev.filter(s => s !== v) : [...prev, v]);

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

    const currentSymptom = [
      ...selectedParts.map(p => `${p} 부위`),
      ...selectedSituations,
    ].join(', ');

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
    setSelectedParts([]);
    setSelectedSituations([]);
  };

  const chatQuestions = ['이 약 부작용이 있나요?', '음식 주의사항 알려줘', '약을 빠뜨렸을 때 어떻게 하나요?'];
  const goodExamples = ['병원 발급 처방전', '약국 조제 영수증', '진료 확인서', '글씨가 선명한 사진'];
  const badExamples = ['흐릿하거나 초점 안 맞는 사진', '일부가 잘린 문서', '빛 반사로 글씨가 안 보이는 사진', '손으로 쓴 메모'];

  return (
    <AppLayout>
      <div className="py-8 px-6">
        <div className="max-w-3xl mx-auto">

          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800">처방전 AI 분석</h1>
            <p className="text-xl text-gray-500 mt-2">
              처방전 이미지를 업로드하면 AI가 약물 정보와 생활 가이드를 분석해드려요.
            </p>
          </div>

          {/* STEP 1: 업로드 */}
          {step === 'upload' && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <p className="text-xl font-semibold text-gray-700 mb-1">
                  어디가 불편하신가요?
                  <span className="text-base font-normal text-gray-400 ml-2">(복수 선택 가능)</span>
                </p>
                <p className="text-base text-gray-400 mb-5">해당하는 항목을 모두 선택해주세요.</p>
                <div className="mb-5">
                  <p className="text-base font-semibold text-gray-500 mb-3">부위</p>
                  <div className="flex flex-wrap gap-3">
                    {BODY_PARTS.map(part => (
                      <CheckChip key={part} label={part}
                        isChecked={selectedParts.includes(part)}
                        onClick={() => togglePart(part)} color="blue" />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-500 mb-3">상황</p>
                  <div className="flex flex-wrap gap-3">
                    {SITUATIONS.map(sit => (
                      <CheckChip key={sit} label={sit}
                        isChecked={selectedSituations.includes(sit)}
                        onClick={() => toggleSituation(sit)} color="indigo" />
                    ))}
                  </div>
                </div>
                {(selectedParts.length > 0 || selectedSituations.length > 0) && (
                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-400 mb-2">AI에게 전달되는 내용</p>
                    <p className="text-base font-medium text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                      {[...selectedParts.map(p => `${p} 부위`), ...selectedSituations].join(', ')}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {preview ? (
                    <img src={preview} alt="미리보기"
                      className="max-h-64 mx-auto rounded-lg object-contain" />
                  ) : (
                    <>
                      <div className="text-5xl mb-3">📄</div>
                      <p className="text-xl text-gray-600 font-medium">클릭하거나 파일을 드래그하세요</p>
                      <p className="text-base text-gray-400 mt-1">JPG, PNG, WEBP, PDF · 최대 10MB</p>
                    </>
                  )}
                </div>
                <input ref={fileInputRef} type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden" onChange={handleFileChange} />
                {selectedFile && (
                  <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg px-4 py-3">
                    <span className="text-base text-blue-700 font-medium truncate">{selectedFile.name}</span>
                    <button onClick={() => { setSelectedFile(null); setPreview(null); }}
                      className="text-gray-400 hover:text-red-500 ml-2 text-lg">✕</button>
                  </div>
                )}
                {error && <p className="text-red-500 text-base mt-3 text-center">{error}</p>}
                <button onClick={() => void handleAnalyze()} disabled={!selectedFile}
                  className="mt-5 w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xl">
                  AI 분석 시작
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                  <p className="text-xl font-bold text-green-700 mb-4">이런 건 잘 돼요</p>
                  <ul className="space-y-3">
                    {goodExamples.map(text => <li key={text} className="text-lg text-green-700">{text}</li>)}
                  </ul>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                  <p className="text-xl font-bold text-red-600 mb-4">이런 건 인식이 어려워요</p>
                  <ul className="space-y-3">
                    {badExamples.map(text => <li key={text} className="text-lg text-red-600">{text}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 분석 중 */}
          {step === 'processing' && (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <div className="text-6xl mb-4 animate-bounce">🔍</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">AI가 분석 중이에요</h2>
              <p className="text-lg text-gray-500 mb-6">
                처방전을 읽고 약물 정보와 생활 가이드를 생성하고 있어요.<br />
                보통 30초~1분 정도 걸려요.
              </p>
              {ocrText && (
                <div className="bg-gray-50 rounded-xl p-4 text-left mt-4">
                  <p className="text-sm text-gray-400 font-medium mb-2">OCR 인식 결과</p>
                  <p className="text-base text-gray-600 whitespace-pre-wrap line-clamp-4">{ocrText}</p>
                </div>
              )}
              <div className="mt-6 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {/* STEP 3: 완료 */}
          {step === 'completed' && result && (
            <div className="space-y-4">

              {/* 진료 정보 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">진료 정보</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '환자명', value: result.patient_name },
                    { label: '생년월일', value: result.birth_date },
                    // ✅ 나이: API 값 대신 birth_date로 직접 계산
                    { label: '나이', value: result.birth_date ? `${calcAge(result.birth_date)}세` : (result.age ? `${result.age}세` : '') },
                    { label: '성별', value: result.gender },
                    // ✅ 진단명: 공백 정규화
                    { label: '진단명', value: normalizeDiagnosis(result.diagnosis) },
                    { label: '병원명', value: result.hospital_name },
                    { label: '담당의', value: result.doctor_name },
                    { label: '진료일', value: result.visit_date },
                  ].map(({ label, value }) =>
                    value ? (
                      <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                        <p className="text-sm text-gray-400 mb-1">{label}</p>
                        <p className="text-base font-semibold text-gray-700">{value}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </div>

              {/* 분석 요약 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">분석 요약</h3>
                <p className="text-base text-gray-600 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
              </div>

              {/* 약물 복용 가이드 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">약물 복용 가이드</h3>
                <p className="text-base text-gray-600 leading-relaxed whitespace-pre-wrap">{result.medication_guide}</p>
              </div>

              {/* 복약 스케줄 */}
              {result.medication_schedules && result.medication_schedules.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-1">복약 스케줄</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    권장 복용 시간이에요.{' '}
                    <span className="font-medium text-gray-500">식후 약은 반드시 식사 후 복용하세요.</span>
                  </p>
                  <div className="space-y-3">
                    {result.medication_schedules.map((scheduleItem, idx) => {
                      const sd = scheduleItem.schedule_date;

                      // 두 가지 구조 모두 처리
                      const medications: MedicationItem[] = sd.medications ?? [
                        {
                          name: sd.drug_name ?? '',
                          times: sd.times ?? [],
                          with_food: sd.with_food ?? false,
                          duration_days: sd.duration_days ?? 0,
                        },
                      ];

                      return medications.map((med, mIdx) => {
                        const timesCount = med.times?.length ?? 1;
                        const recommendedTimes = getRecommendedTimes(timesCount);
                        const durationDays = med.duration_days ?? sd.duration_days ?? 0;

                        return (
                          <div key={`${idx}-${mIdx}`} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-base font-semibold text-gray-700">{med.name}</p>
                                <p className="text-sm text-gray-400 mt-0.5">
                                  {med.with_food ? '식후 복용' : '식전/공복 복용'} · 1일 {timesCount}회
                                  {durationDays > 0 && ` · 총 ${durationDays}일`}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap mb-3">
                              {recommendedTimes.map((t, tIdx) => (
                                <React.Fragment key={tIdx}>
                                  <div className="flex flex-col items-center">
                                    <span className="text-xs text-gray-400 mb-1">{TIME_PERIOD[t] ?? ''}</span>
                                    <span className="bg-blue-100 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-lg">{t}</span>
                                  </div>
                                  {tIdx < recommendedTimes.length - 1 && (
                                    <span className="text-gray-300 text-base">→</span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>

                            {med.with_food ? (
                              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                                <p className="text-sm text-blue-700">
                                  <span className="font-medium">식사 후 복용하세요.</span>{' '}
                                  식사를 거를 경우 소량의 음식과 함께 복용하세요.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                                <p className="text-sm text-amber-700">
                                  <span className="font-medium">식사 30분 전 또는 공복에 복용하세요.</span>
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      });
                    })}
                  </div>
                </div>
              )}

              {/* 약물 상호작용 */}
              {result.drug_interactions && result.drug_interactions.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    약물 상호작용
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      {result.drug_interactions.length}건 발견
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {result.drug_interactions.map((item, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold text-gray-700 text-base">{item.medication_a}</span>
                          <span className="text-gray-400 text-sm">↔</span>
                          <span className="font-semibold text-gray-700 text-base">{item.medication_b}</span>
                          <SeverityBadge severity={item.severity} />
                          {item.interaction_type && (
                            <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                              {item.interaction_type}
                            </span>
                          )}
                        </div>
                        {item.mechanism && (
                          <p className="text-sm text-gray-500 mb-1">
                            <span className="font-medium text-gray-600">작용 원리: </span>{item.mechanism}
                          </p>
                        )}
                        {item.recommendation && (
                          <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                            💡 {item.recommendation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 주의해야 할 증상 */}
              {result.warning_signs && (
                <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                  <h3 className="text-xl font-bold text-red-700 mb-3">주의해야 할 증상</h3>
                  <p className="text-base text-red-600 leading-relaxed whitespace-pre-wrap">{result.warning_signs}</p>
                </div>
              )}

              {/* 생활 습관 가이드 */}
              {result.lifestyle_guide && (
                <div className="bg-white rounded-2xl shadow-sm p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-3">생활 습관 가이드</h3>
                  <p className="text-base text-gray-600 leading-relaxed whitespace-pre-wrap">{result.lifestyle_guide}</p>
                </div>
              )}

              {/* 챗봇 + 하단 버튼 */}
              <div className="mt-2">
                <p className="text-base font-semibold text-gray-400 mb-3 text-center tracking-wide">
                  — 다음 단계로 이동하세요 —
                </p>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-blue-700 text-xl">AI 챗봇에게 질문하기</span>
                    </div>
                    <p className="text-base text-gray-500 mb-3">이 처방전에 대해 더 궁금한 게 있으신가요?</p>
                    <div className="flex flex-wrap gap-2">
                      {chatQuestions.map((q) => (
                        // ✅ 클릭 시 q 파라미터와 함께 이동 → Chat.tsx에서 자동 전송
                        <button
                          key={q}
                          onClick={() => navigate(`/chat?q=${encodeURIComponent(q)}`, {
                            state: { guide_id: guideResultId }
                          })}
                          className="bg-white border border-blue-200 text-blue-600 text-sm px-3 py-1 rounded-full shadow-sm hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                    {/* 챗봇 전체 영역 클릭도 유지 (질문 없이 이동) */}
                    <button
                      onClick={() => navigate('/chat', { state: { guide_id: guideResultId } })}
                      className="mt-3 text-sm text-blue-400 hover:underline"
                    >
                      직접 질문하러 가기 →
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => navigate('/dashboard')}
                      className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:bg-gray-50 transition-all shadow-sm">
                      <div className="font-semibold text-gray-700 text-base">대시보드로 돌아가기</div>
                      <div className="text-sm text-gray-400 mt-1">분석 이력 확인</div>
                    </button>
                    <button onClick={handleReset}
                      className="bg-white border border-gray-200 rounded-2xl p-4 text-left hover:bg-gray-50 transition-all shadow-sm">
                      <div className="font-semibold text-gray-700 text-base">새 처방전 분석</div>
                      <div className="text-sm text-gray-400 mt-1">다른 처방전 업로드</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: 실패 */}
          {step === 'failed' && (
            <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">분석에 실패했어요</h2>
              <p className="text-red-500 text-base mb-6">{error}</p>
              <button onClick={handleReset}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all text-lg">
                다시 시도하기
              </button>
            </div>
          )}

        </div>
      </div>
    </AppLayout>
  );
}
