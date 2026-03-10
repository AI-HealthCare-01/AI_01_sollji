import { useState, useRef } from 'react';
import { profileApi } from '../../api/profileApi';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: number;
  medication_type: string;
}

const MED_TYPES = ['전문의약품', '일반의약품', '건강기능식품', '한약', '기타'];
const FREQUENCY_OPTIONS = [1, 2, 3];

export default function Step3_Medications({ onNext, onBack }: Props) {
  const [medications, setMedications] = useState<MedicationEntry[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualDosage, setManualDosage] = useState('');
  const [manualFrequency, setManualFrequency] = useState(1);
  const [manualType, setManualType] = useState('기타');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addMedication = () => {
    const name = searchInput.trim() || manualName.trim();
    if (!name) return;
    setMedications(prev => [...prev, {
      name,
      dosage: manualDosage || '1정',
      frequency: manualFrequency,
      medication_type: manualType
    }]);
    setSearchInput('');
    setManualName('');
    setManualDosage('');
    setManualFrequency(1);
    setManualType('기타');
  };

  const removeMedication = (index: number) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      for (const med of medications) {
        await profileApi.addMedication({
          medication_name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          medication_type: med.medication_type,
          timing: {}
        });
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
        <h2 className="text-xl font-bold text-gray-800">복용약</h2>
        <p className="text-gray-500 text-sm mt-1">현재 복용 중인 약을 추가해주세요</p>
      </div>

      {/* 방법 1: 처방전 사진 업로드 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          📸 처방전 사진 업로드
          <span className="text-gray-400 font-normal ml-2">(OCR로 약 이름 자동 추출)</span>
        </label>
        <label className={`
          flex flex-col items-center justify-center w-full h-28 border-2 border-dashed
          rounded-xl cursor-pointer transition-all
          ${file ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}
        `}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <p className="text-blue-600 font-medium">📎 {file.name}</p>
          ) : (
            <p className="text-gray-500">📷 처방전 사진을 업로드하면 약 이름을 자동으로 인식해요</p>
          )}
        </label>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-gray-400 text-sm">또는 직접 입력</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* 방법 2: 검색 / 직접 입력 */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMedication()}
            placeholder="🔍 약 이름 검색 또는 직접 입력"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 상세 입력 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">용량</label>
            <input
              type="text"
              value={manualDosage}
              onChange={e => setManualDosage(e.target.value)}
              placeholder="예: 1정, 500mg"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">하루 복용 횟수</label>
            <div className="flex gap-2">
              {FREQUENCY_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setManualFrequency(f)}
                  className={`
                    flex-1 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${manualFrequency === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  {f}회
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">약 종류</label>
            <select
              value={manualType}
              onChange={e => setManualType(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MED_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={addMedication}
          className="w-full py-3 bg-gray-800 text-white rounded-xl font-medium hover:bg-gray-700"
        >
          + 약 추가
        </button>
      </div>

      {/* 추가된 약 목록 */}
      {medications.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            추가된 약 ({medications.length}개)
          </label>
          <div className="space-y-2">
            {medications.map((med, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3
                           bg-blue-50 rounded-xl border border-blue-100"
              >
                <div>
                  <span className="font-medium text-gray-800">{med.name}</span>
                  <span className="text-gray-500 text-sm ml-3">
                    {med.dosage} · 하루 {med.frequency}회 · {med.medication_type}
                  </span>
                </div>
                <button
                  onClick={() => removeMedication(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors text-lg"
                >
                  ×
                </button>
              </div>
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
          {loading ? '저장 중...' : '다음 →'}
        </button>
      </div>
    </div>
  );
}
