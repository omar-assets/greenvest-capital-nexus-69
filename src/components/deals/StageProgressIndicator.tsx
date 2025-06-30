
import { CheckCircle, Circle } from 'lucide-react';

interface StageProgressIndicatorProps {
  currentStage: string;
}

const StageProgressIndicator = ({ currentStage }: StageProgressIndicatorProps) => {
  const stages = [
    'New',
    'Reviewing Documents',
    'Underwriting',
    'Offer Sent',
    'Funded'
  ];

  const currentIndex = stages.indexOf(currentStage);
  const isDeclined = currentStage === 'Declined';

  if (isDeclined) {
    return (
      <div className="bg-slate-800 border-slate-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-center">
          <div className="flex items-center text-red-400">
            <Circle className="h-6 w-6 mr-2" />
            <span className="font-medium">Deal Declined</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border-slate-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => (
          <div key={stage} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                {index <= currentIndex ? (
                  <CheckCircle className="h-6 w-6 text-green-400" />
                ) : (
                  <Circle className="h-6 w-6 text-slate-500" />
                )}
              </div>
              <span className={`text-xs mt-1 ${
                index <= currentIndex ? 'text-green-400' : 'text-slate-500'
              }`}>
                {stage}
              </span>
            </div>
            {index < stages.length - 1 && (
              <div className={`h-0.5 w-16 mx-2 ${
                index < currentIndex ? 'bg-green-400' : 'bg-slate-600'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageProgressIndicator;
