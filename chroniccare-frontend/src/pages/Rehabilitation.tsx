import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import AppLayout from '../components/layout/AppLayout';
import type { RehabPlan, RehabPlanDetail, RehabProgress } from '../types';

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function formatLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function getPlanStartDateString(createdAt?: string | null): string {
  if (!createdAt) return formatLocalDate(new Date());
  return formatDateInTimeZone(new Date(createdAt), 'Asia/Seoul');
}

function getWeekMonthLabel(dates: string[]): string {
  const monthLabels = Array.from(new Set(
    dates.map((date) => `${parseLocalDate(date).getMonth() + 1}월`)
  ));
  return monthLabels.join(' · ');
}

export default function Rehabilitation() {
  const navigate = useNavigate();
  const todayString = formatLocalDate(new Date());

  const [plans, setPlans] = useState<RehabPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<RehabPlanDetail | null>(null);
  const [progress, setProgress] = useState<RehabProgress | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [completions, setCompletions] = useState<Record<string, number>>({});

  const getCurrentWeek = (plan: RehabPlanDetail): number => {
    if (!plan.created_at) return 1;
    const start = parseLocalDate(getPlanStartDateString(plan.created_at));
    const today = parseLocalDate(todayString);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.min(Math.floor(diffDays / 7) + 1, plan.duration_weeks);
  };

  useEffect(() => {
    const initialDate = formatLocalDate(new Date());
    apiClient.get('/api/v1/rehab/plans')
      .then(res => {
        setPlans(res.data.plans);
        const active = res.data.plans.find((p: RehabPlan) => p.is_active);
        if (active) void loadPlanDetail(active.id, initialDate);
      })
      .catch(() => {})
      .finally(() => setLoadingPlans(false));
  }, []);

  const loadPlanDetail = async (planId: number, targetDate: string) => {
    try {
      const [detailRes, progressRes, completionsRes] = await Promise.all([
        apiClient.get(`/api/v1/rehab/plans/${planId}`),
        apiClient.get(`/api/v1/rehab/plans/${planId}/progress`, {
          params: { target_date: targetDate }
        }),
        apiClient.get(`/api/v1/rehab/plans/${planId}/completions`),
      ]);
      setSelectedPlan(detailRes.data);
      setProgress(progressRes.data);
      setCompletions(completionsRes.data.completions);
      setExpandedIds(new Set());
      setSelectedWeek('all');
    } catch (e) { void e; }
  };

  const handleDateChange = async (newDate: string) => {
    setSelectedDate(newDate);
    if (!selectedPlan) return;
    try {
      const res = await apiClient.get(`/api/v1/rehab/plans/${selectedPlan.id}/progress`, {
        params: { target_date: newDate }
      });
      setProgress(res.data);
    } catch { /* ignore */ }
  };

  const handleToggle = async (planId: number, rehabExerciseId: number) => {
    setToggling(rehabExerciseId);
    try {
      await apiClient.post(
        `/api/v1/rehab/plans/${planId}/exercises/${rehabExerciseId}/complete`,
        null,
        { params: { target_date: selectedDate } }
      );
      const res = await apiClient.get(`/api/v1/rehab/plans/${planId}/progress`, {
        params: { target_date: selectedDate }
      });
      setProgress(res.data);
      // 완료 기록 갱신
      const completionsRes = await apiClient.get(`/api/v1/rehab/plans/${planId}/completions`);
      setCompletions(completionsRes.data.completions);
    } catch {
      alert('기록에 실패했어요.');
    } finally {
      setToggling(null);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const handleDeletePlan = async (planId: number) => {
    if (!window.confirm('이 재활 플랜을 삭제할까요?\n완료 기록도 함께 삭제됩니다.')) return;
    try {
      await apiClient.delete(`/api/v1/rehab/plans/${planId}`);
      const updatedPlans = plans.filter(p => p.id !== planId);
      setPlans(updatedPlans);
      if (selectedPlan?.id === planId) {
        if (updatedPlans.length > 0) void loadPlanDetail(updatedPlans[0].id, selectedDate);
        else { setSelectedPlan(null); setProgress(null); }
      }
    } catch { alert('삭제에 실패했어요.'); }
  };

  const isToday = selectedDate === todayString;

  const getCalendarWeeks = (plan: RehabPlanDetail) => {
    const start = parseLocalDate(getPlanStartDateString(plan.created_at));
    const weeks: { week: number; days: { date: string; label: number }[] }[] = [];
    for (let w = 1; w <= plan.duration_weeks; w++) {
      const days = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(start);
        day.setDate(start.getDate() + (w - 1) * 7 + d);
        days.push({
          date: formatLocalDate(day),
          label: day.getDate(),
        });
      }
      weeks.push({ week: w, days });
    }
    return weeks;
  };

  return (
    <AppLayout>
      <div className="py-8 px-8">

        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800">재활 운동</h2>
          <p className="text-gray-500 mt-1">처방된 재활 플랜에 따라 운동을 진행하세요</p>
        </div>

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

        {plans.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {plans.map(p => (
              <div key={p.id} className="group relative">
                <button
                  onClick={() => void loadPlanDetail(p.id, selectedDate)}
                  className={`px-5 py-2.5 pr-8 rounded-xl text-sm font-medium transition-all ${
                    selectedPlan?.id === p.id
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p.target_area}
                </button>
                <button
                  onClick={() => void handleDeletePlan(p.id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400 p-0.5 rounded hover:bg-red-50"
                  title="플랜 삭제"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {selectedPlan && (() => {
          const currentWeek = progress?.current_week ?? getCurrentWeek(selectedPlan);
          const calendarWeeks = getCalendarWeeks(selectedPlan);
          const weeks = [...new Set(selectedPlan.exercises.map(e => e.week_number))].sort((a, b) => a - b);
          const filteredExercises = selectedWeek === 'all'
            ? selectedPlan.exercises
            : selectedPlan.exercises.filter(e => e.week_number === selectedWeek);

          return (
            <div className="space-y-4">

              {/* 현재 부위 배너 */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-5 flex items-center gap-4 relative">
                <div>
                  <p className="text-sm text-blue-400 font-medium">현재 재활 중인 부위</p>
                  <p className="text-2xl font-bold text-blue-700">{selectedPlan.target_area}</p>
                  <p className="text-sm text-gray-400">{selectedPlan.duration_weeks}주 프로그램 · 현재 {currentWeek}주차</p>
                </div>
                {/* 삭제 버튼 */}
                <button
                  onClick={() => void handleDeletePlan(selectedPlan.id)}
                  className="absolute top-3 right-3 text-blue-200 hover:text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-all text-sm"
                  title="플랜 삭제"
                >
                  🗑️
                </button>
              </div>

              {/* ── 달력형 진행률 ── */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 text-base mb-4">전체 진행 달력</h3>
                <div className="space-y-3">
                  {calendarWeeks.map(({ week, days }) => {
                    const isLocked = week > currentWeek;
                    const monthLabel = getWeekMonthLabel(days.map(({ date }) => date));
                    return (
                      <div key={week}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            week === currentWeek
                              ? 'bg-blue-600 text-white'
                              : isLocked
                                ? 'bg-gray-100 text-gray-400'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {week}주차
                          </span>
                          <span className="text-xs text-gray-400 font-medium">{monthLabel}</span>
                          {isLocked && <span className="text-xs text-gray-400">🔒 아직 시작 전</span>}
                          {week === currentWeek && <span className="text-xs text-blue-500 font-medium">진행 중</span>}
                          {!isLocked && week < currentWeek && <span className="text-xs text-green-500 font-medium">완료</span>}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {days.map(({ date, label }) => {
                            const isSelected = date === selectedDate;
                            const isDateToday = date === todayString;
                            const dayExercises = selectedPlan.exercises.filter(
                              e => e.week_number === week
                            ).length;
                            const dayCompleted = completions[date] ?? 0;
                            const allDone = dayCompleted >= dayExercises && dayExercises > 0;

                            return (
                              <button
                                key={date}
                                onClick={() => !isLocked && void handleDateChange(date)}
                                disabled={isLocked}
                                className={`
                                  relative flex flex-col items-center py-2 rounded-xl text-xs font-medium transition-all
                                  ${isLocked ? 'opacity-30 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}
                                  ${isSelected ? 'bg-blue-600 text-white shadow-md' : ''}
                                  ${isDateToday && !isSelected ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' : ''}
                                  ${!isSelected && !isDateToday && !isLocked ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : ''}
                                `}
                              >
                                <span className="text-xs opacity-60 mb-0.5">
                                  {['일','월','화','수','목','금','토'][parseLocalDate(date).getDay()]}
                                </span>
                                <span className="text-sm font-bold">{label}</span>

                                {/* ✅ 선택된 날짜 → 진행률 % 표시 */}
                                {isSelected && progress && (
                                  <span className={`text-xs mt-0.5 font-semibold ${
                                    progress.progress_percent === 100
                                      ? 'text-green-300'
                                      : 'text-blue-200'
                                  }`}>
                                    {progress.progress_percent}%
                                  </span>
                                )}

                                {/* 미선택 날짜 → 완료 도트 */}
                                {!isSelected && !isLocked && dayCompleted > 0 && (
                                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                                    allDone ? 'bg-green-400' : 'bg-yellow-400'
                                  }`} />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 당일 진행률 */}
              {progress && (
                <div className="bg-white rounded-xl shadow-sm px-5 py-3 flex items-center gap-4">
                  <span className="text-sm text-gray-500 font-medium whitespace-nowrap">
                    {isToday ? '오늘' : selectedDate} 진행률
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progress.progress_percent}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-blue-600 whitespace-nowrap">
                    {progress.completed_exercises}/{progress.total_exercises}개
                    &nbsp;{progress.progress_percent}%
                  </span>
                </div>
              )}

              {/* 주의사항 */}
              {selectedPlan.precautions && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5">
                  <p className="text-base font-semibold text-yellow-700 mb-1">주의사항</p>
                  <p className="text-base text-yellow-600">{selectedPlan.precautions}</p>
                </div>
              )}

              {/* 주차 탭 */}
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedWeek('all')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedWeek === 'all'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >전체</button>

                  {weeks.map(week => {
                    const isLocked = week > currentWeek;
                    const weekExercises = selectedPlan.exercises.filter(e => e.week_number === week);
                    const weekCompleted = weekExercises.filter(e =>
                      progress?.completed_exercise_ids.includes(e.rehab_exercise_id)
                    ).length;
                    const weekTotal = weekExercises.length;
                    const allDone = weekCompleted === weekTotal;
                    const isCurrentWeek = selectedWeek === week;

                    return (
                      <button
                        key={week}
                        onClick={() => !isLocked && setSelectedWeek(week)}
                        disabled={isLocked}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                          isLocked
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            : isCurrentWeek
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {isLocked ? '🔒' : ''}{week}주차
                        {!isLocked && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                            allDone
                              ? isCurrentWeek ? 'bg-white text-green-600' : 'bg-green-100 text-green-600'
                              : isCurrentWeek ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
                          }`}>
                            {weekCompleted}/{weekTotal}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedWeek !== 'all' && !(() => selectedWeek > currentWeek)() && (() => {
                  const weekExercises = selectedPlan.exercises.filter(e => e.week_number === selectedWeek);
                  const weekCompleted = weekExercises.filter(e =>
                    progress?.completed_exercise_ids.includes(e.rehab_exercise_id)
                  ).length;
                  const pct = Math.round(weekCompleted / weekExercises.length * 100);
                  return (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                        <span>{selectedWeek}주차 진행률</span>
                        <span className="font-semibold text-blue-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 운동 목록 */}
              <div className="space-y-4">
                {filteredExercises
                  .sort((a, b) => a.sequence_order - b.sequence_order)
                  .map(ex => {
                    const isExpanded = expandedIds.has(ex.rehab_exercise_id);
                    const isLocked = ex.week_number > currentWeek;
                    const isDone = !isLocked && (progress?.completed_exercise_ids.includes(ex.rehab_exercise_id) ?? false);

                    const formatInstructions = (text: string) => {
                      return text
                        .split(/(?=\d+\.)/)
                        .map(s => s.trim())
                        .filter(Boolean);
                    };

                    return (
                      <div
                        key={ex.rehab_exercise_id}
                        className={`rounded-2xl shadow-sm p-6 transition-all ${
                          isLocked
                            ? 'bg-gray-50 border border-gray-200 opacity-60'
                            : isDone
                              ? 'bg-green-50 border border-green-200'
                              : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                              {isDone && <span className="text-green-500 text-xl">✅</span>}
                              {isLocked && <span className="text-gray-400">🔒</span>}
                              <h4 className={`text-xl font-bold ${
                                isLocked ? 'text-gray-400' : isDone ? 'text-green-700' : 'text-gray-800'
                              }`}>
                                {ex.exercise?.exercise_name ?? '운동'}
                              </h4>
                              {ex.exercise?.difficulty_level && (
                                <span className={`text-sm px-3 py-1 rounded-full font-semibold ${difficultyColor(ex.exercise.difficulty_level)}`}>
                                  {difficultyLabel(ex.exercise.difficulty_level)}
                                </span>
                              )}
                              <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                                {ex.week_number}주차
                              </span>
                            </div>

                            <div className="flex gap-4 mb-5">
                              {ex.sets > 0 && (
                                <div className="text-center bg-blue-50 rounded-xl px-5 py-3 min-w-[72px]">
                                  <p className="text-2xl font-bold text-blue-600">{ex.sets}</p>
                                  <p className="text-sm text-blue-400 font-medium mt-0.5">세트</p>
                                </div>
                              )}
                              {ex.reps > 0 && (
                                <div className="text-center bg-green-50 rounded-xl px-5 py-3 min-w-[72px]">
                                  <p className="text-2xl font-bold text-green-600">{ex.reps}</p>
                                  <p className="text-sm text-green-400 font-medium mt-0.5">회</p>
                                </div>
                              )}
                              {ex.duration_seconds != null && ex.duration_seconds > 0 && (
                                <div className="text-center bg-purple-50 rounded-xl px-5 py-3 min-w-[72px]">
                                  <p className="text-2xl font-bold text-purple-600">{ex.duration_seconds}</p>
                                  <p className="text-sm text-purple-400 font-medium mt-0.5">초</p>
                                </div>
                              )}
                            </div>

                            {ex.exercise?.instructions && (
                              <div className="mb-4">
                                <div className={`space-y-2 ${isExpanded ? '' : 'max-h-[80px] overflow-hidden'}`}>
                                  {formatInstructions(ex.exercise.instructions).map((step, i) => {
                                    const hasNumber = /^\d+\./.test(step);
                                    return (
                                      <div key={i} className="flex gap-2 items-start">
                                        {!hasNumber && (
                                          <span className="text-blue-400 font-bold text-sm shrink-0 mt-0.5">
                                            {i + 1}.
                                          </span>
                                        )}
                                        <p className="text-base text-gray-600 leading-relaxed">{step}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                                <button
                                  onClick={() => toggleExpand(ex.rehab_exercise_id)}
                                  className="text-sm text-blue-500 mt-2 hover:underline font-medium"
                                >
                                  {isExpanded ? '▲ 접기' : '▼ 전체 보기'}
                                </button>
                              </div>
                            )}

                            {ex.exercise?.video_url && (
                              <a
                                href={ex.exercise.video_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 mt-1 mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-red-100 transition-all"
                              >
                                ▶ 동영상으로 보기
                              </a>
                            )}

                            {ex.special_notes && (
                              <p className="text-base text-blue-600 bg-blue-50 rounded-xl px-4 py-2.5 mb-3">
                                📌 {ex.special_notes}
                              </p>
                            )}

                            {ex.exercise?.tags && ex.exercise.tags.length > 0 && (
                              <div className="flex gap-2 flex-wrap mt-2">
                                {ex.exercise.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="text-sm bg-gray-100 text-gray-500 px-3 py-1 rounded-full"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => !isLocked && void handleToggle(selectedPlan.id, ex.rehab_exercise_id)}
                            disabled={toggling === ex.rehab_exercise_id || isLocked}
                            className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                              isLocked
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : isDone
                                  ? 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600'
                                  : 'bg-green-500 text-white hover:bg-green-600'
                            }`}
                          >
                            {isLocked
                              ? '🔒 잠김'
                              : toggling === ex.rehab_exercise_id
                                ? '처리 중...'
                                : isDone
                                  ? '✓ 완료됨 (취소)'
                                  : '✓ 완료'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

            </div>
          );
        })()}

      </div>
    </AppLayout>
  );
}
