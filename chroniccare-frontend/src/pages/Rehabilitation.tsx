import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';

interface RehabPlan {
  id: number;
  target_area: string;
  duration_weeks: number;
  precautions: string;
  is_active: boolean;
  created_at: string;
}

interface Exercise {
  rehab_exercise_id: number;
  week_number: number;
  sequence_order: number;
  sets: number;
  reps: number;
  duration_seconds: number;
  special_notes: string;
  exercise: {
    exercise_id: number;
    exercise_name: string;
    category: string;
    difficulty_level: string;
    instructions: string;
    video_url: string;
    thumbnail_url: string;
    tags: string[];
  } | null;
}

interface PlanDetail extends RehabPlan {
  exercises: Exercise[];
}

interface Progress {
  total_exercises: number;
  completed_exercises: number;
  progress_percent: number;
}

export default function Rehabilitation() {
  const navigate = useNavigate();

  const [plans, setPlans] = useState<RehabPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    apiClient.get('/api/v1/rehab/plans')
      .then(res => {
        setPlans(res.data.plans);
        const active = res.data.plans.find((p: RehabPlan) => p.is_active);
        if (active) void loadPlanDetail(active.id);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const loadPlanDetail = async (planId: number) => {
    try {
      const [detailRes, progressRes] = await Promise.all([
        apiClient.get(`/api/v1/rehab/plans/${planId}`),
        apiClient.get(`/api/v1/rehab/plans/${planId}/progress`),
      ]);
      setSelectedPlan(detailRes.data);
      setProgress(progressRes.data);
      setExpandedIds(new Set());
    } catch (e) {
      void e;
    }
  };

  const handleComplete = async (planId: number, rehabExerciseId: number) => {
    setCompleting(rehabExerciseId);
    try {
      await apiClient.post(`/api/v1/rehab/plans/${planId}/exercises/${rehabExerciseId}/complete`, {});
      const res = await apiClient.get(`/api/v1/rehab/plans/${planId}/progress`);
      setProgress(res.data);
    } catch {
      alert('완료 기록에 실패했어요.');
    } finally {
      setCompleting(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const difficultyColor = (level: string) => {
    if (level === '초급' || level === 'low') return 'bg-green-100 text-green-700';
    if (level === '중급' || level === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const difficultyLabel = (level: string) => {
    if (level === 'low') return '초급';
    if (level === 'medium') return '중급';
    if (level === 'high') return '고급';
    return level;
  };

  return (
    <AppLayout>
      <div className="py-8 px-8">

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">🏃 재활 운동</h2>
          <p className="text-gray-500 mt-1">처방된 재활 플랜에 따라 운동을 진행하세요</p>
        </div>

        {/* 플랜 없음 */}
        {!loadingPlans && plans.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🏋️</div>
            <p className="text-gray-600 font-semibold text-lg mb-2">재활 플랜이 없어요</p>
            <p className="text-gray-400 text-sm mb-6">처방전 분석 후 AI가 맞춤 재활 플랜을 생성해드려요</p>
            <button
              onClick={() => navigate('/prescription')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all"
            >
              처방전 분석하러 가기
            </button>
          </div>
        )}

        {/* 플랜 탭 */}
        {plans.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => void loadPlanDetail(p.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedPlan?.id === p.id
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.target_area}
                {p.is_active && <span className="ml-1.5">🟢</span>}
              </button>
            ))}
          </div>
        )}

        {/* 플랜 상세 */}
        {selectedPlan && (
          <div className="space-y-4">

            {/* 현재 부위 배너 */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 flex items-center gap-4">
              <span className="text-4xl">🩺</span>
              <div>
                <p className="text-sm text-blue-400 font-medium">현재 재활 중인 부위</p>
                <p className="text-2xl font-bold text-blue-700">{selectedPlan.target_area}</p>
                <p className="text-sm text-gray-400">{selectedPlan.duration_weeks}주 프로그램</p>
              </div>
            </div>

            {/* 진행률 */}
            {progress && (
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-lg">전체 진행률</h3>
                  <span className="text-3xl font-bold text-blue-600">{progress.progress_percent}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progress.progress_percent}%` }}
                  />
                </div>
                <p className="text-sm text-gray-400 mt-2">
                  전체 {progress.total_exercises}개 중 {progress.completed_exercises}개 완료
                </p>
              </div>
            )}

            {/* 주의사항 */}
            {selectedPlan.precautions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                <p className="text-base font-semibold text-yellow-700 mb-1">⚠️ 주의사항</p>
                <p className="text-base text-yellow-600">{selectedPlan.precautions}</p>
              </div>
            )}

            {/* 운동 목록 */}
            <div className="space-y-4">
              {selectedPlan.exercises
                .sort((a, b) => a.sequence_order - b.sequence_order)
                .map(ex => {
                  const isExpanded = expandedIds.has(ex.rehab_exercise_id);
                  return (
                    <div key={ex.rehab_exercise_id} className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">

                          {/* 운동명 + 배지 */}
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <h4 className="text-lg font-bold text-gray-800">
                              {ex.exercise?.exercise_name ?? '운동'}
                            </h4>
                            {ex.exercise?.difficulty_level && (
                              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${difficultyColor(ex.exercise.difficulty_level)}`}>
                                {difficultyLabel(ex.exercise.difficulty_level)}
                              </span>
                            )}
                            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                              {ex.week_number}주차
                            </span>
                          </div>

                          {/* 세트 / 횟수 */}
                          <div className="flex gap-6 mb-4">
                            {ex.sets > 0 && (
                              <div className="text-center bg-blue-50 rounded-xl px-4 py-2 min-w-[64px]">
                                <p className="text-2xl font-bold text-blue-600">{ex.sets}</p>
                                <p className="text-xs text-blue-400 font-medium">세트</p>
                              </div>
                            )}
                            {ex.reps > 0 && (
                              <div className="text-center bg-green-50 rounded-xl px-4 py-2 min-w-[64px]">
                                <p className="text-2xl font-bold text-green-600">{ex.reps}</p>
                                <p className="text-xs text-green-400 font-medium">회</p>
                              </div>
                            )}
                            {ex.duration_seconds > 0 && (
                              <div className="text-center bg-purple-50 rounded-xl px-4 py-2 min-w-[64px]">
                                <p className="text-2xl font-bold text-purple-600">{ex.duration_seconds}</p>
                                <p className="text-xs text-purple-400 font-medium">초</p>
                              </div>
                            )}
                          </div>

                          {/* 운동 설명 */}
                          {ex.exercise?.instructions && (
                            <div className="mb-3">
                              <p className={`text-sm text-gray-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                                {ex.exercise.instructions}
                              </p>
                              <button
                                onClick={() => toggleExpand(ex.rehab_exercise_id)}
                                className="text-xs text-blue-500 mt-1 hover:underline"
                              >
                                {isExpanded ? '▲ 접기' : '▼ 전체 보기'}
                              </button>
                            </div>
                          )}

                          {/* 동영상 버튼 */}
                          {ex.exercise?.video_url && (
                            <a
                              href={ex.exercise.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 mt-1 mb-3 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
                            >
                              ▶ 동영상으로 보기
                            </a>
                          )}

                          {/* 특이사항 */}
                          {ex.special_notes && (
                            <p className="text-sm text-blue-500 mb-2">📌 {ex.special_notes}</p>
                          )}

                          {/* 태그 */}
                          {ex.exercise?.tags && ex.exercise.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {ex.exercise.tags.map(tag => (
                                <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                        </div>

                        {/* 완료 버튼 */}
                        <button
                          onClick={() => void handleComplete(selectedPlan.id, ex.rehab_exercise_id)}
                          disabled={completing === ex.rehab_exercise_id}
                          className="flex-shrink-0 bg-green-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-all"
                        >
                          {completing === ex.rehab_exercise_id ? '기록 중...' : '✓ 완료'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

      </div>
    </AppLayout>
  );
}
