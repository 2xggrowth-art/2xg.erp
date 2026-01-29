import { LucideIcon, ArrowRight } from 'lucide-react';

interface ProcessStep {
  icon: LucideIcon;
  title: string;
  description: string;
  status?: 'success' | 'error' | 'default';
  label?: string;
  arrowLabel?: string;
}

interface ProcessFlowProps {
  title: string;
  steps: ProcessStep[];
}

const ProcessFlow = ({ title, steps }: ProcessFlowProps) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-slate-800 mb-12 text-center">{title}</h2>

      <div className="flex flex-wrap items-start justify-center gap-8">
        {steps.map((step, index) => (
          <div key={index} className="flex items-start">
            {/* Step Card */}
            <div className="flex flex-col items-center" style={{ width: '200px' }}>
              {/* Icon Container */}
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center mb-3
                ${step.status === 'success' ? 'bg-green-100 border-2 border-green-500' :
                  step.status === 'error' ? 'bg-red-100 border-2 border-red-500' :
                  'bg-blue-100 border-2 border-blue-500'}
              `}>
                <step.icon
                  size={28}
                  className={
                    step.status === 'success' ? 'text-green-600' :
                    step.status === 'error' ? 'text-red-600' :
                    'text-blue-600'
                  }
                />
              </div>

              {/* Step Info */}
              <div className="text-center px-2">
                <h3 className="font-semibold text-slate-800 mb-1 text-sm">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
              </div>

              {/* Status Label */}
              {step.label && (
                <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                  step.status === 'success' ? 'bg-green-100 text-green-700' :
                  step.status === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {step.label}
                </div>
              )}
            </div>

            {/* Arrow with label */}
            {index < steps.length - 1 && (
              <div className="flex flex-col items-center justify-center mx-2 mt-5">
                {step.arrowLabel ? (
                  <>
                    <span className="text-xs text-slate-600 mb-1 whitespace-nowrap">{step.arrowLabel}</span>
                    <ArrowRight size={20} className="text-slate-400" />
                  </>
                ) : (
                  <ArrowRight size={20} className="text-slate-400" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcessFlow;
