import { useState } from 'react';
import { profileApi } from '../../api/profileApi';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const COMMON_CONDITIONS = [
  '고혈압',
  '당뇨',
  '고지혈증',
  '골다공증',
  '관절염',
  '빈혈',
];

export default function Step2_Conditions({ onNext, onBack }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customList, setCustomList] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleCondition = (condition: string) => {
    setSelected(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
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
      const all = [...selected, ...customList];
      for (const condition of all) {
        await profileApi.addCondition({ condition_type: condition });
      }
      onNext();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800">기저질환</h2>
        <p className="text-gray-500 text-sm mt-1">해당하는 질환을 모두 선택해주세요</p>
      </div>

      {/* 자주 있는 질환 체크박스 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">자주 있는 질환</label>
        <div className="grid grid-cols-4 gap-3">
          {COMMON_CONDITIONS.map(condition => (
            <button
              key={condition}
              onClick={() => toggleCondition(condition)}
              className={`
                py-3 px-4 rounded-xl text-sm font-medium transition-all text-left
                ${selected.includes(condition)
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
              `}
            >
              {selected.includes(condition) ? '✓ ' : ''}{condition}
            </button>
          ))}
        </div>
      </div>

      {/* 직접 입력 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          직접 입력 <span className="text-gray-400 font-normal">(위에 없는 경우)</span>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="질환명 입력 후 Enter 또는 추가 버튼"
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

        {/* 직접 입력한 항목들 */}
        {customList.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customList.map(item => (
              <span
                key={item}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700
                           rounded-full text-sm font-medium"
              >
                {item}
                <button
                  onClick={() => removeCustom(item)}
                  className="ml-1 text-blue-400 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 처방전/진단서 업로드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          📄 처방전 / 진단서 업로드
          <span className="text-gray-400 font-normal ml-2">(AI가 질환을 자동으로 추출해요)</span>
        </label>
        <label className={`
          flex flex-col items-center justify-center w-full h-32 border-2 border-dashed
          rounded-xl cursor-pointer transition-all
          ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
        `}>
          <input
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <div className="text-center">
              <p className="text-blue-600 font-medium">📎 {file.name}</p>
              <p className="text-gray-400 text-xs mt-1">클릭하여 변경</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-500">📁 파일을 드래그하거나 클릭하여 업로드</p>
              <p className="text-gray-400 text-xs mt-1">이미지, PDF 지원</p>
            </div>
          )}
        </label>
      </div>

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
          {loading ? '저장 중...' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
