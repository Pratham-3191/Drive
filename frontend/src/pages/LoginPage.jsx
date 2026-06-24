import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HardDrive } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      tempErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      tempErrors.password = 'Password is required';
    } else if (password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters long';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await login(email, password);

      if (!result.success) {
        setGeneralError(result.message || 'Invalid email or password');
      }
    } catch (error) {
      setGeneralError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
    if (generalError) {
      setGeneralError('');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <HardDrive className="h-10 w-10 text-gray-700" />
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">
          Sign in to Drive Manager
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-200 rounded sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>

              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={handleEmailChange}
                  className={`block w-full px-3 py-2 border rounded text-sm placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.email
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-1 focus:ring-gray-600 focus:border-gray-600'
                  }`}
                />
              </div>

              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`block w-full px-3 py-2 border rounded text-sm placeholder-gray-400 focus:outline-none transition-colors ${
                    errors.password
                      ? 'border-red-500 focus:ring-1 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-1 focus:ring-gray-600 focus:border-gray-600'
                  }`}
                />
              </div>

              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {errors.password}
                </p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 rounded text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:bg-gray-400 transition-colors"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>

              {generalError && (
                <p className="mt-3 text-center text-sm text-red-600 font-medium">
                  {generalError}
                </p>
              )}
            </div>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <span className="text-sm text-gray-600">
              New here?{' '}
              <Link
                to="/signup"
                className="font-medium text-gray-900 underline hover:text-gray-700"
              >
                Create an account
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;