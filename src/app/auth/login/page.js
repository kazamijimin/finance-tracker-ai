'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Anchor } from 'lucide-react';

export default function FinanceTrackerLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/home'); // Adjust route as needed
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 via-orange-50 to-red-50 relative overflow-hidden">
      {/* Tropical decorative elements */}
      <div className="absolute top-0 left-0 w-32 h-32">
        <div className="absolute top-8 left-8">
          <div className="w-6 h-8 bg-green-500 rounded-b-full transform rotate-12"></div>
          <div className="w-4 h-6 bg-green-400 rounded-b-full transform -rotate-6 -mt-4 ml-3"></div>
          <div className="w-3 h-4 bg-green-300 rounded-b-full transform rotate-12 -mt-2 ml-1"></div>
        </div>
        <div className="absolute top-12 left-16 w-8 h-6 bg-orange-400 rounded-full"></div>
        <div className="absolute top-10 left-20 w-6 h-4 bg-orange-300 rounded-full"></div>
        <div className="absolute top-14 left-18 w-4 h-3 bg-orange-500 rounded-full"></div>
      </div>

      <div className="absolute top-0 right-0 w-32 h-32">
        <div className="absolute top-6 right-6">
          <div className="w-8 h-10 bg-green-600 rounded-b-full transform -rotate-12"></div>
          <div className="w-6 h-8 bg-green-500 rounded-b-full transform rotate-6 -mt-6 -mr-2"></div>
        </div>
        <div className="absolute top-16 right-12 w-6 h-4 bg-orange-400 rounded-full"></div>
        <div className="absolute top-12 right-16 w-4 h-3 bg-orange-300 rounded-full"></div>
      </div>

      {/* Main content */}
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="pt-12 pb-6 px-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 via-orange-400 to-yellow-500 rounded-full shadow-lg mb-4">
            <Anchor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
            Treasure Tracker
          </h1>
          <p className="text-gray-600 text-base" style={{fontFamily: 'Poppins, sans-serif'}}>
            Navigate Your Financial Adventure
          </p>
        </div>

        {/* Login Form */}
        <div className="flex-1 px-4">
          <div className="bg-white rounded-3xl shadow-xl p-8 mx-auto max-w-md relative overflow-hidden">
            {/* Straw Hat Crew decorative elements */}
            <div className="absolute top-4 right-4 opacity-10">
              <div className="w-16 h-8 bg-yellow-600 rounded-full"></div>
              <div className="w-12 h-2 bg-red-600 rounded-full mx-auto -mt-1"></div>
            </div>
            <div className="absolute bottom-4 left-4 opacity-10 text-4xl">⚔️</div>
            <div className="absolute top-8 left-6 opacity-10 text-2xl">🏴‍☠️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center relative z-10" style={{fontFamily: 'Poppins, sans-serif'}}>Welcome Back</h2>
            <p className="text-gray-600 text-center mb-6 relative z-10" style={{fontFamily: 'Poppins, sans-serif'}}>Sign in to continue your journey</p>
            
            <div className="space-y-4">
              {/* Email */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800"
                  style={{fontFamily: 'Poppins, sans-serif'}}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  className="w-full pl-10 pr-12 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-800"
                  style={{fontFamily: 'Poppins, sans-serif'}}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Remember me & Forgot password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                    Remember me
                  </span>
                </label>
                <button className="text-sm text-red-600 hover:text-red-700 font-semibold" style={{fontFamily: 'Poppins, sans-serif'}}>
                  Forgot Password?
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                  {error}
                </div>
              )}

              {/* Login Button */}
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{fontFamily: 'Poppins, sans-serif'}}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Setting Sail...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Social Login Options */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="px-4 text-gray-500 text-sm" style={{fontFamily: 'Poppins, sans-serif'}}>Or continue with</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              <div className="flex space-x-3">
                <button className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins, sans-serif'}}>Google</span>
                </button>
                
                <button className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins, sans-serif'}}>Facebook</span>
                </button>
                
                <button className="flex-1 flex items-center justify-center py-3 px-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="#333" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  <span className="text-sm font-medium text-gray-700" style={{fontFamily: 'Poppins, sans-serif'}}>GitHub</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom text */}
          <div className="text-center mt-6 pb-6">
            <p className="text-gray-600 text-sm" style={{fontFamily: 'Poppins, sans-serif'}}>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => router.push('signup')}
                className="text-red-600 font-semibold hover:text-red-700"
                style={{fontFamily: 'Poppins, sans-serif'}}
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}