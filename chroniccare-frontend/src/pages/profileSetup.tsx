import { useState } from 'react';
import StepIndicator from '../components/profile/StepIndicator';
import Step1_BasicInfo from '../components/profile/Step1_BasicInfo';
import Step2_Conditions from '../components/profile/Step2_Conditions';
import Step3_Medications from '../components/profile/Step3_Medications';
import Step4_Allergies from '../components/profile/Step4_Allergies';
import { useNavigate } from 'react-router-dom';

const STEPS = ['기본정보', '기저질환', '복용약', '알레르기'];

export default function ProfileSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
    else navigate('/dashboard'); // 완료 후 이동
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">건강 프로필 설정</h1>
          <p className="text-gray-500 mt-2">
            정확한 건강 정보를 입력하면 더 나은 분석을 받을 수 있어요
          </p>
        </div>

        {/* 진행바 */}
        <StepIndicator steps={STEPS} currentStep={currentStep} />

        {/* 스텝 컨텐츠 */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mt-6">
          {currentStep === 1 && <Step1_BasicInfo onNext={handleNext} />}
          {currentStep === 2 && <Step2_Conditions onNext={handleNext} onBack={handleBack} />}
          {currentStep === 3 && <Step3_Medications onNext={handleNext} onBack={handleBack} />}
          {currentStep === 4 && <Step4_Allergies onNext={handleNext} onBack={handleBack} />}
        </div>

      </div>
    </div>
  );
}
