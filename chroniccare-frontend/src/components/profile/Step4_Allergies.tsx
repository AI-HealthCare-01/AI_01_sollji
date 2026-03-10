import { useState } from 'react';
import { profileApi } from '../../api/profileApi';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const ALLERGY_CATEGORIES = [
  {
    label: '💊 약물',
    type: '약물',
    items: ['페니실린', '아스피린', '설파제', '이부프로펜', '세파로스포린']
  },
  {
    label: '🍽️ 음식',
    type: '음식',
    items: ['땅콩', '갑각류', '유제품', '밀/글루텐', '달걀', '견과류', '생선', '대두']
  },
  {
    label: '🌿 환경',
    type: '환경',
    items: ['꽃가루', '집먼지진드기', '동물털', '곰팡이', '라텍스']
  },
];

export default function Step4_Allergies({ onNext, onBack }: Props) {
  const [selected, setSelected] = useState<{ name: string; type: string }[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleAllergy = (name: string, type: string) => {
    setSelected(prev =>
      prev.some(a => a.name === name)
        ? prev.filter(a => a.name !== name)
        : [...prev, { name, type }]
    );
  };

  const addCustom = () => {
    if (!customInput.trim()) return;
    setCustomList(prev => [...prev, customInput.trim()]);
    setCustomInput('');
  };

  const removeCustom = (item: string) => {
    setCustomList(prev => prev.filter(c => c !== item));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      for (const allergy of selected) {
        await profileApi.addAllergy({
          allergen_name: allergy.name,
          allergen_type: allergy.type,
        });
      }
      for (const name of customList) {
        await profileApi.addAllergy({
          allergen_name: name,
          allergen_type: '기타',
        });
      }
      onNext(); // → dashboard로 이동
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800">알레르기</h2>
        <p className="text-gray-500 text-sm mt-1">알레르기가 있는 항목을 선택해주세요</p>
      </div>

      {/* 카테고리별 선택 */}
      {ALLERGY_CATEGORIES.map(category => (
        <div key={category.label}>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {category.label}
          </label>
          <div className="flex flex-wrap gap-2">
            {category.items.map(item => {
              const isSelected = selected.some(a => a.name === item);
              return (
                <button
                  key={item}
                  onClick={() => toggleAllergy(item, category.type)}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${isSelected
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  {isSelected ? '✓ ' : ''}{item}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* 기타 직접 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          기타 <span className="text-gray-400 font-normal">(위에 없는 알레르기)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="알레르기 항목 입력"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addCustom}
            className="px-5 py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700"
          >
            추가
          </button>
        </div>

        {customList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customList.map(item => (
              <span
                key={item}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600
                           rounded-full text-sm font-medium"
              >
                {item}
                <button
                  onClick={() => removeCustom(item)}
                  className="ml-1 text-red-300 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 선택 요약 */}
      {(selected.length > 0 || customList.length > 0) && (
        <div className="p-4 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm font-medium text-red-700 mb-2">
            ⚠️ 선택된 알레르기 {selected.length + customList.length}개
          </p>
          <div className="flex flex-wrap gap-1">
            {selected.map(a => (
              <span key={a.name} className="px-2 py-1 bg-white text-red-600 rounded-full text-xs border border-red-200">
                {a.name}
              </span>
            ))}
            {customList.map(name => (
              <span key={name} className="px-2 py-1 bg-white text-red-600 rounded-full text-xs border border-red-200">
                {name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-8 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200"
        >
          ← 이전
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium
                     hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? '저장 중...' : '완료!'}
        </button>
      </div>
    </div>
  );
}
