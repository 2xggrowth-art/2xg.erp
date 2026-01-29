import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';

const ComingSoonPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">
            We're working hard to bring you this feature. Stay tuned for updates!
          </p>

          {/* Additional Info */}
          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <p className="text-sm text-gray-700">
              This feature is currently under development and will be available soon.
              We appreciate your patience!
            </p>
          </div>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
