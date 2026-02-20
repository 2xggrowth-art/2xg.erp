import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Lock, LogIn, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const TechnicianLoginPage = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { technicianLogin } = useAuth();
  const navigate = useNavigate();

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  const handlePinPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = [...pin];
    for (let i = 0; i < 4; i++) {
      newPin[i] = pasted[i] || '';
    }
    setPin(newPin);
    const focusIdx = Math.min(pasted.length, 3);
    pinRefs.current[focusIdx]?.focus();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/[\s\-]/g, '').replace(/^\+91/, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    const pinValue = pin.join('');
    if (pinValue.length !== 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    setIsLoading(true);
    try {
      const success = await technicianLogin({ phone: cleanPhone, pin: pinValue });
      if (success) {
        navigate('/buildline');
      } else {
        setError('Invalid phone number or PIN');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg3djFoLTd6TTAgMTM0aDd2MUgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl mb-4 shadow-lg">
            <Wrench className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Buildline Login</h1>
          <p className="text-slate-400 text-sm">Sign in with your phone number & PIN</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Phone Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, '').slice(0, 10))}
                  placeholder="10-digit phone number"
                  maxLength={10}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition text-lg tracking-wider"
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* PIN Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                4-Digit PIN
              </label>
              <div className="flex gap-3 justify-center" onPaste={handlePinPaste}>
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { pinRefs.current[i] = el; }}
                    type="password"
                    inputMode="numeric"
                    value={digit}
                    onChange={(e) => handlePinChange(i, e.target.value)}
                    onKeyDown={(e) => handlePinKeyDown(i, e)}
                    maxLength={1}
                    className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition"
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          2XG Buildline &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default TechnicianLoginPage;
