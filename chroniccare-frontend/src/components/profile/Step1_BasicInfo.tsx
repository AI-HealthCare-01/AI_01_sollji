import { useState } from 'react';
import { profileApi } from '../../api/profileApi';

interface Props {
  onNext: () => void;
}

const BLOOD_TYPES = ['A', 'B', 'O', 'AB', '모름'];
const SMOKING_OPTIONS = ['비흡연', '과거흡연', '가끔', '매일'];
const ALCOHOL_OPTIONS = ['안마심', '월 1~2회', '주 1~2회', '거의 매일'];
const EXERCISE_OPTIONS = ['안함', '주 1~2회', '주 3~4회', '매일'];

export default function Step1_BasicInfo({ onNext }: Props) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [exercise, setExercise] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  setLoading(true);
  try {
    await profileApi.upsertHealth({
      height: height || undefined,
      weight: weight || undefined,
      blood_type: bloodType || undefined,
      smoking_status: smoking || undefined,
      alcohol_frequency: alcohol || undefined,
      exercise_frequency: exercise || undefined,
    });
    onNext();
  } catch (err: unknown) {
    console.error('Step1 에러:', err);
    console.error('응답:', (err as { response?: { data?: unknown } })?.response?.data);
    onNext(); // API 실패해도 다음 단계로 (개발 중 임시)
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800">기본 건강정보</h2>
        <p className="text-gray-500 text-sm mt-1">입력하지 않아도 나중에 추가할 수 있어요</p>
      </div>

      {/* 키 / 몸무게 */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">키</label>
          <div className="relative">
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="170"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-4 top-3.5 text-gray-400 text-sm">cm</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">몸무게</label>
          <div className="relative">
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="65"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-4 top-3.5 text-gray-400 text-sm">kg</span>
          </div>
        </div>
      </div>

      {/* 혈액형 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">혈액형</label>
        <div className="flex gap-3">
          {BLOOD_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setBloodType(type === bloodType ? '' : type)}
              className={`
                flex-1 py-3 rounded-xl font-medium text-sm transition-all
                ${bloodType === type
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 흡연 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">흡연 여부</label>
        <div className="grid grid-cols-4 gap-3">
          {SMOKING_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setSmoking(opt === smoking ? '' : opt)}
              className={`
                py-3 rounded-xl font-medium text-sm transition-all
                ${smoking === opt
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 음주 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">음주 빈도</label>
        <div className="grid grid-cols-4 gap-3">
          {ALCOHOL_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setAlcohol(opt === alcohol ? '' : opt)}
              className={`
                py-3 rounded-xl font-medium text-sm transition-all
                ${alcohol === opt
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 운동 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">운동 빈도</label>
        <div className="grid grid-cols-4 gap-3">
          {EXERCISE_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setExercise(opt === exercise ? '' : opt)}
              className={`
                py-3 rounded-xl font-medium text-sm transition-all
                ${exercise === opt
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* 다음 버튼 */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium
                     hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? '저장 중...' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
