import { useState, useEffect, useRef } from 'react';
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

function normalizeMedicationItem(value: unknown): Medication | null {
  if (!value || typeof value !== 'object') return null;

  const item = value as Record<string, unknown>;
  const id = Number(item.id);
  const medicationName = typeof item.medication_name === 'string' ? item.medication_name : '';
  const dosage = typeof item.dosage === 'string' ? item.dosage : '';
  const frequency = typeof item.frequency === 'number' ? item.frequency : undefined;

  if (!Number.isFinite(id) || !medicationName.trim()) {
    return null;
  }

  return {
    id,
    medication_name: medicationName,
    dosage,
    frequency,
  };
}

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
  const [newCondition, setNewCondition] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // ─── 데이터 로드 ─────────────────────────────────────────
  useEffect(() => {
    profileApi.getFullProfile()
      .then(res => {
        const d = res?.data ?? res ?? {};
        setHealth(d.health_profile || {});
        setHEdit(d.health_profile || {});
        setConditions(d.conditions || []);
        setMedications(
          Array.isArray(d.medications)
            ? d.medications
                .map(normalizeMedicationItem)
                .filter((item: Medication | null): item is Medication => item !== null)
            : []
        );
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
    const conditionName = newCondition.trim();
    if (!conditionName) return;
    if (conditions.some(c => c.condition_type.trim().toLowerCase() === conditionName.toLowerCase())) {
      setNewCondition('');
      return;
    }
    try {
      const res = await profileApi.addCondition({ condition_type: conditionName });
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
    const medicationName = newMedication.trim();
    if (!medicationName) return;
    if (medications.some(m =>
      (m.medication_name ?? '').trim().toLowerCase() === medicationName.toLowerCase()
    )) {
      setNewMedication('');
      return;
    }
    try {
      const res = await profileApi.addMedication({
        medication_name: medicationName,
      });
      const addedMedication = normalizeMedicationItem(res?.data ?? res);
      if (addedMedication) {
        setMedications(prev => [...prev, addedMedication]);
      } else {
        const profile = await profileApi.getFullProfile();
        const profileData = profile?.data ?? profile ?? {};
        setMedications(
          Array.isArray(profileData.medications)
            ? profileData.medications
                .map(normalizeMedicationItem)
                .filter((item: Medication | null): item is Medication => item !== null)
            : []
        );
      }
      setNewMedication('');
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
    const allergyName = newAllergy.trim();
    if (!allergyName) return;
    if (allergies.some(a => a.allergen_name.trim().toLowerCase() === allergyName.toLowerCase())) {
      setNewAllergy('');
      return;
    }
    try {
      const res = await profileApi.addAllergy({ allergen_name: allergyName });
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

            {/* ── 복용약  ── */}
            <ListCard
              title="💊 복용약"
              items={medications.map(m => ({ id: m.id, label: m.medication_name, sub: m.dosage }))}
              editing={editingMedication}
              onToggleEdit={() => setEditingMedication(p => !p)}
              onDelete={handleDeleteMedication}
              addSlot={
                <AddRow
                  placeholder="약 이름 직접 입력"
                  value={newMedication}
                  onChange={setNewMedication}
                  onAdd={handleAddMedication}
                />
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
  const isComposingRef = useRef(false);

  return (
    <div className="flex gap-2">
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={e => {
          isComposingRef.current = false;
          onChange(e.currentTarget.value);
        }}
        onKeyDown={e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (isComposingRef.current || e.nativeEvent.isComposing || e.keyCode === 229) return;
          onAdd();
        }}
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
