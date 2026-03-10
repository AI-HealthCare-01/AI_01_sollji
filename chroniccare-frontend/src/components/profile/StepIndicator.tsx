interface Props {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* 원 + 라벨 */}
            <div className="flex flex-col items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                transition-all duration-300
                ${isCompleted ? 'bg-blue-500 text-white' : ''}
                ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' : ''}
                ${!isCompleted && !isActive ? 'bg-gray-200 text-gray-400' : ''}
              `}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span className={`
                text-xs mt-1 font-medium
                ${isActive ? 'text-blue-600' : 'text-gray-400'}
              `}>
                {step}
              </span>
            </div>

            {/* 연결선 */}
            {index < steps.length - 1 && (
              <div className={`
                w-20 h-0.5 mb-4 mx-1 transition-all duration-300
                ${isCompleted ? 'bg-blue-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
}
