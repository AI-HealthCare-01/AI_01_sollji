import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import type { DrugInteraction, MedicationSchedule } from '../types';

interface GuideDetail {
  guide_result_id: number;
  status: string;
  overall_safety_score: number;
  summary: string;
  medication_guide: string;
  lifestyle_guide: string;
  warning_signs: string;
  drug_interactions?: DrugInteraction[];
  medication_schedules?: MedicationSchedule[];
}

interface HistoryItem {
  guide_result_id: number;
  status: string;
  created_at: string;
  patient_name: string | null;
  diagnosis: string | null;
  hospital_name: string | null;
  summary: string | null;
}

const RECOMMENDED_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '13:00', '19:00'],
  4: ['08:00', '12:00', '17:00', '21:00'],
  5: ['07:00', '10:00', '13:00', '17:00', '21:00'],
  6: ['07:00', '09:00', '12:00', '15:00', '18:00', '21:00'],
};

function getRecommendedTimes(count: number): string[] {
  return RECOMMENDED_TIMES[count] ?? RECOMMENDED_TIMES[3];
}

function parseMedications(text: string) {
  return text.split('\n').filter(line => line.trim() !== '');
}

function formatDate(isoString: string) {
  const d = new Date(isoString);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-600',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-green-100 text-green-600',
  };
  const label: Record<string, string> = {
    high: '높음', medium: '중간', low: '낮음',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[severity] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[severity] ?? severity}
    </span>
  );
}

export default function AnalysisResult() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<GuideDetail | null>(null);
  const [meta, setMeta] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/api/v1/analysis/${id}/status`),
      apiClient.get(`/api/v1/analysis/history`),
    ])
      .then(([statusRes, historyRes]) => {
        setResult(statusRes.data);
        const found = historyRes.data.find(
          (item: HistoryItem) => item.guide_result_id === Number(id)
        );
        setMeta(found ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-500 text-xl">결과를 불러오는 중...</p>
      </div>
    </div>
  );

  if (error || !result) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-gray-600 text-xl font-medium">결과를 불러올 수 없어요</p>
        <button onClick={() => navigate('/dashboard')}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl text-lg">
          대시보드로 돌아가기
        </button>
      </div>
    </div>
  );

  const medications = parseMedications(result.medication_guide || '');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 헤더 */}
      <div className="bg-white shadow-sm px-8 py-5 flex items-center gap-4">
        <button onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-gray-600 text-3xl font-bold">←</button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800">분석 결과</h1>
          <p className="text-base text-gray-400">처방전 #{result.guide_result_id}</p>
        </div>
        <span className="text-base px-4 py-2 rounded-full font-medium bg-green-100 text-green-600">
          분석 완료
        </span>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">

        {/* 처방전 정보 */}
        {meta && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-600 mb-4">처방전 정보</h2>
            <div className="grid grid-cols-2 gap-y-4">
              {meta.patient_name && (<><span className="text-gray-400 text-base">환자명</span><span className="text-gray-800 font-semibold text-base">{meta.patient_name}</span></>)}
              {meta.hospital_name && (<><span className="text-gray-400 text-base">병원명</span><span className="text-gray-800 font-semibold text-base">{meta.hospital_name}</span></>)}
              {meta.diagnosis && (<><span className="text-gray-400 text-base">진단명</span><span className="text-gray-800 font-semibold text-base">{meta.diagnosis}</span></>)}
              {meta.created_at && (<><span className="text-gray-400 text-base">처방일</span><span className="text-gray-800 font-semibold text-base">{formatDate(meta.created_at)}</span></>)}
            </div>
          </div>
        )}

        {/* AI 분석 요약 */}
        {result.summary && (
          <div className="bg-blue-600 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-3">AI 분석 요약</h2>
            <p className="text-lg text-blue-50 leading-relaxed">{result.summary}</p>
          </div>
        )}

        {/* 약물 복용 가이드 */}
        {medications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">약물 복용 가이드</h2>
            <div className="space-y-3">
              {medications.map((med, idx) => (
                <div key={idx} className="flex gap-4 bg-gray-50 rounded-xl p-4 items-start">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-lg text-gray-800 leading-relaxed">
                    {med.replace(/^\d+\.\s*/, '')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 복약 스케줄 */}
        {result.medication_schedules && result.medication_schedules.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-1">복약 스케줄</h2>
            <p className="text-sm text-gray-400 mb-4">
              권장 복용 시간이에요.{' '}
              <span className="font-medium text-gray-500">
                식후 약은 반드시 식사 후 복용하세요.
              </span>
            </p>
            <div className="space-y-4">
              {result.medication_schedules.map((scheduleItem, idx) => {
                const sd = scheduleItem.schedule_date;
                const drugName     = sd.drug_name;
                const timesCount   = sd.times?.length ?? 1;
                const withFood     = sd.with_food;
                const durationDays = sd.duration_days;
                // LLM 시간 무시하고 횟수 기반으로 재계산
                const recommendedTimes = getRecommendedTimes(timesCount);

                return (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                    <div className="mb-3">
                      <p className="text-base font-semibold text-gray-700">{drugName}</p>
                      <p className="text-sm text-gray-400 mt-0.5">
                        {withFood ? '식후 복용' : '식전/공복 복용'}
                        {timesCount > 0 && ` · 1일 ${timesCount}회`}
                        {durationDays > 0 && ` · 총 ${durationDays}일`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {recommendedTimes.map((t, tIdx) => (
                        <span key={tIdx}
                          className="bg-blue-50 text-blue-600 text-sm px-3 py-1.5 rounded-full font-medium">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className={`text-sm rounded-lg px-3 py-2 ${
                      withFood ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      {withFood
                        ? '반드시 식사 후 복용하세요.'
                        : '식사 전 또는 공복에 복용하세요.'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 약물 상호작용 */}
        {result.drug_interactions && result.drug_interactions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-4">
              약물 상호작용{' '}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {result.drug_interactions.length}건 발견
              </span>
            </h2>
            <div className="space-y-3">
              {result.drug_interactions.map((item, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {(item.medication_a || item.medication_b) ? (
                      <>
                        <span className="font-semibold text-gray-700">{item.medication_a}</span>
                        <span className="text-gray-400 text-sm">↔</span>
                        <span className="font-semibold text-gray-700">{item.medication_b}</span>
                      </>
                    ) : (
                      <span className="font-semibold text-gray-700">{item.interaction_type}</span>
                    )}
                    <SeverityBadge severity={item.severity} />
                    {item.interaction_type && (item.medication_a || item.medication_b) && (
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                        {item.interaction_type}
                      </span>
                    )}
                  </div>
                  {item.mechanism && (
                    <p className="text-sm text-gray-500 mb-1">
                      <span className="font-medium text-gray-600">작용 원리: </span>
                      {item.mechanism}
                    </p>
                  )}
                  {item.recommendation && (
                    <p className="text-sm text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2">
                      {item.recommendation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주의해야 할 증상 */}
        {result.warning_signs && (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-100">
            <h2 className="text-lg font-bold text-red-600 mb-3">주의해야 할 증상</h2>
            <p className="text-lg text-red-700 leading-relaxed whitespace-pre-line">
              {result.warning_signs}
            </p>
          </div>
        )}

        {/* 생활 습관 가이드 */}
        {result.lifestyle_guide && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-700 mb-3">생활 습관 가이드</h2>
            <p className="text-lg text-gray-600 leading-relaxed whitespace-pre-line">
              {result.lifestyle_guide}
            </p>
          </div>
        )}

        {/* 챗봇 배너 */}
        <div onClick={() => navigate('/chat', { state: { guide_id: Number(id) } })}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 cursor-pointer hover:from-blue-600 hover:to-blue-700 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg mb-1">약에 대해 더 궁금한 점이 있나요?</p>
              <p className="text-blue-100 text-base">AI 챗봇에게 부작용, 복용법 등을 물어보세요</p>
            </div>
            <span className="text-white text-3xl">›</span>
          </div>
        </div>

        {/* 운동 배너 */}
        <div onClick={() => navigate('/rehabilitation')}
          className="bg-gradient-to-r from-emerald-400 to-green-500 rounded-2xl p-6 cursor-pointer hover:from-emerald-500 hover:to-green-600 transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-lg mb-1">회복에 도움되는 운동 보기</p>
              <p className="text-green-50 text-base">진단에 맞는 재활 운동 목록을 확인해보세요</p>
            </div>
            <span className="text-white text-3xl">›</span>
          </div>
        </div>

      </div>
    </div>
  );
}
