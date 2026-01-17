import { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    console.log('Login attempt started', { email });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Please enter your password');
      setIsLoading(false);
      return;
    }

    try {
      // Get users from localStorage (in production, this would be an API call)
      let usersData = localStorage.getItem('users');

      // Initialize default users if none exist
      if (!usersData) {
        const defaultUsers = [
          { id: '1', name: 'Zaheer', email: 'mohd.zaheer@gmail.com', password: 'admin123', role: 'Admin', status: 'Active' },
          { id: '2', name: 'Rahul Kumar', email: 'rahul@gmail.com', password: 'admin123', role: 'Manager', status: 'Active' },
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
        usersData = JSON.stringify(defaultUsers);
      }

      const users = JSON.parse(usersData);
      console.log('Users loaded:', users.length);

      // Find user by email
      const user = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      console.log('User found:', !!user);

      if (!user) {
        setError('No account found with this email address');
        setIsLoading(false);
        return;
      }

      // Check if user is active
      if (user.status !== 'Active') {
        setError('Your account has been deactivated. Please contact administrator.');
        setIsLoading(false);
        return;
      }

      // Verify password
      if (user.password !== password) {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      // Successful login
      const authData = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAuthenticated: true,
        loginTime: new Date().toISOString()
      };

      console.log('Login successful, saving auth data');
      localStorage.setItem('authUser', JSON.stringify(authData));

      // Redirect to dashboard immediately
      console.log('Redirecting to dashboard...');
      window.location.href = '/';
      // Force page reload to ensure auth state is loaded
      // setTimeout(() => {
      //   navigate('/');
      // }, 500);

    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNGg3djFoLTd6TTAgMTM0aDd2MUgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl font-bold text-white">2XG</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-slate-300">Sign in to your Business Suite account</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Forgot password?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500 mb-3">Demo Credentials</p>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Admin:</span>
                <span className="font-mono text-gray-800">mohd.zaheer@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Manager:</span>
                <span className="font-mono text-gray-800">rahul@gmail.com</span>
              </div>
              <p className="text-gray-500 text-center pt-2">Default password: admin123</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-300 text-sm mt-6">
          2XG Business Suite &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
