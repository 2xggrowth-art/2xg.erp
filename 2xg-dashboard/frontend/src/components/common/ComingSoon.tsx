import { Rocket, Construction, Calendar, CheckCircle } from 'lucide-react';

interface ComingSoonProps {
  moduleName: string;
  description?: string;
  features?: string[];
}

const ComingSoon = ({ moduleName, description, features }: ComingSoonProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-30 rounded-full"></div>
              <Rocket className="relative text-blue-600 animate-bounce" size={64} />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-center text-slate-800 mb-3">
            {moduleName}
          </h1>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Construction className="text-amber-500" size={24} />
            <p className="text-2xl font-semibold text-amber-600">Coming Soon</p>
          </div>

          {/* Description */}
          {description && (
            <p className="text-center text-slate-600 mb-8 text-lg leading-relaxed">
              {description}
            </p>
          )}

          {/* Features Preview */}
          {features && features.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-blue-600" />
                Planned Features
              </h3>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Status Badge */}
          <div className="flex justify-center gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
              <span className="font-medium">In Development</span>
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-slate-500 mt-8 text-sm">
            This module is currently under development. Check back soon for updates!
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
