import React, { useState } from 'react';
import Step1Welcome from './Step1Welcome';
import Step2Appearance from './Step2Appearance';
import Step3Printer from './Step3Printer';
import Step4Sync from './Step4Sync';
import { Check } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

const STEPS = [
  { number: 1, label: 'Welcome' },
  { number: 2, label: 'Appearance' },
  { number: 3, label: 'Printer' },
  { number: 4, label: 'Sync' },
];

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [cloudConfigured, setCloudConfigured] = useState(false);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await window.electronAPI.setAppSetting('setup_completed', 'true');
      onComplete();
    } catch (err) {
      console.error('Failed to save setup completion:', err);
      // Still proceed even if setting fails
      onComplete();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Welcome
            onCloudConfigured={(configured) => setCloudConfigured(configured)}
          />
        );
      case 2:
        return <Step2Appearance />;
      case 3:
        return <Step3Printer />;
      case 4:
        return <Step4Sync cloudConfigured={cloudConfigured} />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 pt-8 pb-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            2XG POS Setup
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Step {currentStep} of {STEPS.length}
          </p>

          {/* Progress indicator */}
          <div className="flex items-center mt-6 gap-1">
            {STEPS.map((step, index) => {
              const isCompleted = currentStep > step.number;
              const isActive = currentStep === step.number;

              return (
                <React.Fragment key={step.number}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                        transition-all duration-200
                        ${
                          isCompleted
                            ? 'bg-blue-600 text-white'
                            : isActive
                            ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                        }
                      `}
                    >
                      {isCompleted ? <Check size={16} /> : step.number}
                    </div>
                    <span
                      className={`
                        text-sm font-medium hidden sm:inline
                        ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : isCompleted
                            ? 'text-gray-700 dark:text-gray-300'
                            : 'text-gray-400 dark:text-gray-500'
                        }
                      `}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`
                        flex-1 h-0.5 mx-2
                        ${
                          currentStep > step.number
                            ? 'bg-blue-600'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }
                      `}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto">{renderStep()}</div>
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-8 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`
              px-5 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${
                currentStep === 1
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
              }
            `}
          >
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Finish Setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetupWizard;
