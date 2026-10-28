import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Eye, EyeOff, Lock } from 'lucide-react';
import apiClient from '../api/client';

export default function Login() {
  const [email, setEmail] = useState('operator@elogbook.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      const role = (response.data.user?.role || 'operator').toLowerCase();
      if (role === 'supervisor') {
        navigate('/reviews');
      } else if (role === 'operator') {
        navigate('/logbooks');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 xl:p-16 relative overflow-hidden select-none">
        {/* Subtle Industrial Grid & Geometric Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.4) 1px, transparent 1px),
              radial-gradient(circle at 100% 0%, rgba(13, 148, 136, 0.4) 0%, transparent 60%)
            `,
            backgroundSize: '40px 40px, 40px 40px, 100% 100%'
          }}
        />

        {/* Brand / Logo Header */}
        <div className="relative z-10 flex items-center gap-3.5">
          <div className="p-2 rounded bg-white/5 border border-white/10 flex items-center justify-center">
            <Factory className="w-7 h-7 text-accent" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-white leading-tight">eLogBook</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Industrial Operations</span>
          </div>
        </div>
        
        {/* Main Content (positioned at ~35-40% from top) */}
        <div className="relative z-10 pt-12 pb-24 my-auto max-w-[540px]">
          {/* Eyebrow */}
          <div className="mb-4 inline-flex items-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-400/90">
              Industrial Operations Platform
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-[54px] font-bold text-white tracking-tight leading-[1.08] mb-6">
            Digitize Every<br />Industrial Log.
          </h1>

          {/* Description */}
          <p className="text-base text-slate-300 font-normal leading-relaxed max-w-[520px]">
            Replace paper-based equipment logging with structured, traceable digital records.
          </p>
        </div>
        
        {/* Left-aligned Footer */}
        <div className="relative z-10 text-slate-400/70 text-xs font-medium tracking-wide">
          &copy; 2026 eLogBook Systems. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center text-primary mb-10">
            <Factory className="w-10 h-10 text-accent mr-3" />
            <span className="text-2xl font-bold tracking-tight">eLogBook</span>
          </div>
          
          <div className="industrial-card">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-primary">Sign In</h2>
              <p className="text-secondary mt-2 text-sm">Access the Industrial Operations Platform</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-critical/10 border-l-4 border-critical text-critical text-sm rounded-r flex items-center">
                <Lock className="w-4 h-4 mr-2" /> {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-secondary mb-2" htmlFor="email">
                  Employee ID / Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="industrial-input"
                  placeholder="name@elogbook.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="industrial-input pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary hover:text-primary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-secondary">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <a href="#" className="font-medium text-accent hover:text-accent/80">
                    Forgot Password?
                  </a>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="industrial-btn-primary w-full"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
          
          <div className="mt-8 text-center text-xs text-secondary/60">
            Secure Industrial Operations Platform
          </div>
        </div>
      </div>
    </div>
  );
}
