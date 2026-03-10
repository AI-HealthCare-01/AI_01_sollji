import { useState, useEffect, useRef } from 'react'; // ← useRef 추가
import { profileApi } from '../api/profileApi';
import AppLayout from '../components/layout/AppLayout';

// ─── 타입 ────────────────────────────────────────────────────
interface HealthData {
  height?: string; weight?: string; blood_type?: string;
  smoking_status?: string; alcohol_frequency?: string; exercise_frequency?: string;
}
interface Condition  { id: number; condition_type: string; severity?: string; notes?: string; }
interface Medication { id: number; medication_name: string; dosage?: string; frequency?: number; }
interface Allergy    { id: number; allergen_name: string; allergen_type?: string; severity?: string; }

// ─── 상수 ────────────────────────────────────────────────────
const BLOOD_TYPES      = ['A', 'B', 'O', 'AB', '모름'];
const SMOKING_OPTIONS  = ['비흡연', '과거흡연', '가끔', '매일'];
const ALCOHOL_OPTIONS  = ['안마심', '월 1~2회', '주 1~2회', '거의 매일'];
const EXERCISE_OPTIONS = ['안함', '주 1~2회', '주 3~4회', '매일'];

// ✅ 추가: 자주 쓰는 약 목록
const COMMON_MEDICATIONS = [
  '타이레놀', '아스피린', '이부프로펜', '나프록센',
  '메트포르민', '글리메피리드', '인슐린',
  '암로디핀', '로사르탄', '리시노프릴', '발사르탄', '텔미사르탄',
  '아토르바스타틴', '로수바스타틴', '심바스타틴',
  '오메프라졸', '판토프라졸', '에소메프라졸', '라베프라졸',
  '세티리진', '로라타딘', '펙소페나딘',
  '레보티록신', '메티마졸',
  '알프라졸람', '로라제팜', '클로나제팜',
  '아목시실린', '세파클러', '독시사이클린', '아지트로마이신',
  '프레드니솔론', '덱사메타손',
  '글루코사민', '칼슘', '비타민D', '오메가3', '엽산',
];

export default function HealthProfile() {

  // ─── 데이터 상태 ─────────────────────────────────────────
  const [health,      setHealth]      = useState<HealthData>({});
  const [conditions,  setConditions]  = useState<Condition[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies,   setAllergies]   = useState<Allergy[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ─── 수정 모드 상태 ───────────────────────────────────────
  const [editingHealth,     setEditingHealth]     = useState(false);
  const [editingCondition,  setEditingCondition]  = useState(false);
  const [editingMedication, setEditingMedication] = useState(false);
  const [editingAllergy,    setEditingAllergy]    = useState(false);

  // ─── 기본 건강정보 편집값 ─────────────────────────────────
  const [hEdit, setHEdit] = useState<HealthData>({});

  // ─── 새 항목 입력값 ───────────────────────────────────────
  const [newCondition,  setNewCondition]  = useState('');
  const [newMedication, setNewMedication] = useState({ name: '', dosage: '' });
  const [newAllergy,    setNewAllergy]    = useState('');

  // ✅ 추가: 자동완성 드롭다운 표시 여부
  const [showSuggestions, setShowSuggestions] = useState(false);
  const medicationRef = useRef<HTMLDivElement>(null);

  // ✅ 추가: 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (medicationRef.current && !medicationRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── 데이터 로드 ─────────────────────────────────────────
  useEffect(() => {
    profileApi.getFullProfile()
      .then(res => {
        const d = res?.data ?? res ?? {};
        setHealth(d.health_profile || {});
        setHEdit(d.health_profile || {});
        setConditions(d.conditions || []);
        setMedications(d.medications || []);
        setAllergies(d.allergies || []);
      })
      .catch(err => {
        console.error('건강 프로필 로드 실패:', err);
        setHealth({});
        setHEdit({});
        setConditions([]);
        setMedications([]);
        setAllergies([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // ─── 핸들러: 기본 건강정보 저장 ──────────────────────────
  const handleSaveHealth = async () => {
    try {
      await profileApi.upsertHealth(hEdit);
      setHealth(hEdit);
      setEditingHealth(false);
    } catch (e) { console.error(e); }
  };

  // ─── 핸들러: 기저질환 추가 / 삭제 ────────────────────────
  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;
    try {
      const res = await profileApi.addCondition({ condition_type: newCondition });
      setConditions(prev => [...prev, res?.data ?? res]);
      setNewCondition('');
    } catch (e) { console.error(e); }
  };
  const handleDeleteCondition = async (id: number) => {
    try {
      await profileApi.deleteCondition(id);
      setConditions(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error(e); }
  };

  // ─── 핸들러: 복용약 추가 / 삭제 ──────────────────────────
  const handleAddMedication = async () => {
    if (!newMedication.name.trim()) return;
    try {
      const res = await profileApi.addMedication({
        medication_name: newMedication.name,
        dosage: newMedication.dosage || undefined,
      });
      setMedications(prev => [...prev, res?.data ?? res]);
      setNewMedication({ name: '', dosage: '' });
      setShowSuggestions(false);
    } catch (e) { console.error(e); }
  };
  const handleDeleteMedication = async (id: number) => {
    try {
      await profileApi.deleteMedication(id);
      setMedications(prev => prev.filter(m => m.id !== id));
    } catch (e) { console.error(e); }
  };

  // ─── 핸들러: 알레르기 추가 / 삭제 ────────────────────────
  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    try {
      const res = await profileApi.addAllergy({ allergen_name: newAllergy });
      setAllergies(prev => [...prev, res?.data ?? res]);
      setNewAllergy('');
    } catch (e) { console.error(e); }
  };
  const handleDeleteAllergy = async (id: number) => {
    try {
      await profileApi.deleteAllergy(id);
      setAllergies(prev => prev.filter(a => a.id !== id));
    } catch (e) { console.error(e); }
  };

  // ✅ 추가: 입력값 기반 필터링된 약 목록
  const filteredMeds = newMedication.name.trim()
    ? COMMON_MEDICATIONS.filter(m =>
        m.toLowerCase().includes(newMedication.name.toLowerCase())
      ).slice(0, 6) // 최대 6개만 표시
    : COMMON_MEDICATIONS.slice(0, 6); // 빈 칸이면 상위 6개 표시

  // ─── 렌더 ────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto py-10 px-6 space-y-5">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">건강 프로필</h1>
          <p className="text-gray-400 text-sm mt-1">건강 정보를 항목별로 관리해요</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            불러오는 중...
          </div>
        ) : (
          <>
            {/* ── 기본 건강정보 ── */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-gray-700">📊 기본 건강정보</h2>
                {!editingHealth ? (
                  <button
                    onClick={() => { setHEdit(health); setEditingHealth(true); }}
                    className="text-sm text-blue-500 font-medium hover:underline"
                  >
                    수정
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingHealth(false)}
                    className="text-sm text-gray-400 hover:underline"
                  >
                    취소
                  </button>
                )}
              </div>

              {!editingHealth ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  {[
                    ['키',    health.height ? `${health.height} cm` : '-'],
                    ['몸무게', health.weight ? `${health.weight} kg` : '-'],
                    ['혈액형', health.blood_type ?? '-'],
                    ['흡연',   health.smoking_status ?? '-'],
                    ['음주',   health.alcohol_frequency ?? '-'],
                    ['운동',   health.exercise_frequency ?? '-'],
                  ].map(([label, value]) => (
                    <div key={label}
                      className="flex items-center justify-between py-1.5 border-b border-gray-50">
                      <span className="text-sm text-gray-400">{label}</span>
                      <span className="text-sm font-medium text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <LabelInput label="키 (cm)"     value={hEdit.height ?? ''}
                      onChange={v => setHEdit(p => ({ ...p, height: v }))}  placeholder="170" />
                    <LabelInput label="몸무게 (kg)" value={hEdit.weight ?? ''}
                      onChange={v => setHEdit(p => ({ ...p, weight: v }))}  placeholder="65" />
                  </div>
                  <ToggleGroup label="혈액형"   options={BLOOD_TYPES}
                    value={hEdit.blood_type ?? ''}
                    onChange={v => setHEdit(p => ({ ...p, blood_type: v }))} />
                  <ToggleGroup label="흡연 여부" options={SMOKING_OPTIONS}
                    value={hEdit.smoking_status ?? ''}
                    onChange={v => setHEdit(p => ({ ...p, smoking_status: v }))} />
                  <ToggleGroup label="음주 빈도" options={ALCOHOL_OPTIONS}
                    value={hEdit.alcohol_frequency ?? ''}
                    onChange={v => setHEdit(p => ({ ...p, alcohol_frequency: v }))} />
                  <ToggleGroup label="운동 빈도" options={EXERCISE_OPTIONS}
                    value={hEdit.exercise_frequency ?? ''}
                    onChange={v => setHEdit(p => ({ ...p, exercise_frequency: v }))} />
                  <button onClick={handleSaveHealth}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm
                               font-semibold hover:bg-blue-700 transition-all mt-2">
                    저장
                  </button>
                </div>
              )}
            </div>

            {/* ── 기저질환 ── */}
            <ListCard
              title="🦠 기저질환"
              items={conditions.map(c => ({ id: c.id, label: c.condition_type, sub: c.severity }))}
              editing={editingCondition}
              onToggleEdit={() => setEditingCondition(p => !p)}
              onDelete={handleDeleteCondition}
              addSlot={
                <AddRow
                  placeholder="예: 고혈압, 당뇨"
                  value={newCondition}
                  onChange={setNewCondition}
                  onAdd={handleAddCondition}
                />
              }
            />

            {/* ── 복용약 ✅ 콤보박스로 교체 ── */}
            <ListCard
              title="💊 복용약"
              items={medications.map(m => ({ id: m.id, label: m.medication_name, sub: m.dosage }))}
              editing={editingMedication}
              onToggleEdit={() => setEditingMedication(p => !p)}
              onDelete={handleDeleteMedication}
              addSlot={
                <div className="space-y-2" ref={medicationRef}>

                  {/* 약 이름 — 자동완성 콤보박스 */}
                  <div className="relative">
                    <input
                      value={newMedication.name}
                      onChange={e => {
                        setNewMedication(p => ({ ...p, name: e.target.value }));
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="약 이름 검색 또는 직접 입력"
                      className={inputCls}
                    />

                    {/* 드롭다운 */}
                    {showSuggestions && filteredMeds.length > 0 && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200
                                     rounded-xl shadow-lg overflow-hidden">
                        {filteredMeds.map(med => (
                          <li
                            key={med}
                            onMouseDown={() => {
                              setNewMedication(p => ({ ...p, name: med }));
                              setShowSuggestions(false);
                            }}
                            className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50
                                       hover:text-blue-600 cursor-pointer transition-colors"
                          >
                            💊 {med}
                          </li>
                        ))}
                        {/* 직접 입력한 값이 목록에 없으면 "직접 추가" 옵션 표시 */}
                        {newMedication.name.trim() &&
                          !COMMON_MEDICATIONS.some(
                            m => m.toLowerCase() === newMedication.name.toLowerCase()
                          ) && (
                          <li
                            onMouseDown={() => setShowSuggestions(false)}
                            className="px-4 py-2.5 text-sm text-blue-500 font-medium
                                       hover:bg-blue-50 cursor-pointer border-t border-gray-100
                                       transition-colors"
                          >
                            ✏️ "{newMedication.name}" 직접 입력
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* 용량 입력 */}
                  <input
                    value={newMedication.dosage}
                    onChange={e => setNewMedication(p => ({ ...p, dosage: e.target.value }))}
                    placeholder="용량 (예: 500mg, 선택)"
                    className={inputCls}
                  />

                  <button
                    onClick={handleAddMedication}
                    className="w-full bg-blue-600 text-white py-2 rounded-xl text-sm
                               font-semibold hover:bg-blue-700 transition-all"
                  >
                    + 추가
                  </button>
                </div>
              }
            />

            {/* ── 알레르기 ── */}
            <ListCard
              title="🌿 알레르기"
              items={allergies.map(a => ({ id: a.id, label: a.allergen_name, sub: a.allergen_type }))}
              editing={editingAllergy}
              onToggleEdit={() => setEditingAllergy(p => !p)}
              onDelete={handleDeleteAllergy}
              addSlot={
                <AddRow
                  placeholder="예: 페니실린, 땅콩"
                  value={newAllergy}
                  onChange={setNewAllergy}
                  onAdd={handleAddAllergy}
                />
              }
            />
          </>
        )}

      </div>
    </AppLayout>
  );
}

// ─── 공통 스타일 ──────────────────────────────────────────────
const inputCls = `w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-300`;

// ─── 공통 컴포넌트 ────────────────────────────────────────────
function LabelInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} className={inputCls} />
    </div>
  );
}

function ToggleGroup({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt === value ? '' : opt)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              value === opt
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function ListCard({ title, items, editing, onToggleEdit, onDelete, addSlot }: {
  title: string;
  items: { id: number; label: string; sub?: string }[];
  editing: boolean;
  onToggleEdit: () => void;
  onDelete: (id: number) => void;
  addSlot: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-700">{title}</h2>
        <button onClick={onToggleEdit}
          className="text-sm text-blue-500 font-medium hover:underline">
          {editing ? '완료' : '수정'}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-300 mb-3">등록된 항목이 없어요</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {items.map(item => (
            <li key={item.id}
              className="flex items-center justify-between px-4 py-2.5
                         bg-gray-50 rounded-xl">
              <div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                {item.sub && (
                  <span className="text-xs text-gray-400 ml-2">{item.sub}</span>
                )}
              </div>
              {editing && (
                <button onClick={() => onDelete(item.id)}
                  className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors">
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editing && addSlot}
    </div>
  );
}

function AddRow({ placeholder, value, onChange, onAdd }: {
  placeholder: string; value: string;
  onChange: (v: string) => void; onAdd: () => void;
}) {
  return (
    <div className="flex gap-2">
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onAdd()}
        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-300" />
      <button onClick={onAdd}
        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold
                   hover:bg-blue-700 transition-all">
        + 추가
      </button>
    </div>
  );
}
