
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';

import {
    User,
    Lock,
    Eye,
    EyeOff,
    LogIn,
    AlertCircle,
    GraduationCap,
    ShieldCheck,
    ArrowLeft,
    KeyRound
} from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || location.state?.from || '/dashboard';

    const { login, isAuthenticated } = useAuth();
    const { settings, showToast } = useSchool();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [forgotModalOpen, setForgotModalOpen] = useState(false);

    // Username Change
    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    // Password Change
    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

    // Login Submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!username.trim() || !password) {
            setError('Please provide both username and password.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await login(username.trim(), password);

            setLoading(false);

            if (result.success) {
                showToast(
                    'Welcome to SchoolSphere Portal',
                    'success',
                    'Session Authenticated'
                );

                navigate(from, { replace: true });
            } else {
                setError(
                    result.message ||
                    'Invalid username or password. Please try again.'
                );
            }
        } catch (err) {
            setLoading(false);
            setError('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#e0f7fa] via-[#e6fffa] to-[#f0fdfa] text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-cyan-500 selection:text-white font-sans overflow-hidden">

            {/* Background School Campus */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">

                <img
                    src="/school-campus-bg.avif"
                    alt="School Campus Environment"
                    className="w-full h-full object-cover object-center opacity-30 scale-100"
                />

                {/* Soft Aqua Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#e0f7fa]/80 via-[#ecfeff]/75 to-[#f0fdfa]/85" />

            </div>

            {/* Background Ambient Effects */}
            <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-cyan-300/35 blur-[120px] pointer-events-none z-0" />

            <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-300/30 blur-[120px] pointer-events-none z-0" />

            {/* Top Bar */}
            <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs z-10">

                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-cyan-800 hover:text-cyan-950 font-bold transition group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />

                    <span>Back to SchoolSphere Home</span>
                </Link>

                <span className="text-cyan-900/70 font-semibold">
                    Session 2026–2027
                </span>

            </div>

            {/* Main Login Card */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-3xl p-8 sm:p-10 shadow-2xl shadow-cyan-900/15 border-2 border-cyan-300/80 z-10">

                {/* Header */}
                <div className="text-center mb-7">

                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/25 mx-auto mb-3.5">

                        <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-cyan-300">
                            <GraduationCap className="w-7 h-7" />
                        </div>

                    </div>

                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-cyan-800 bg-cyan-100 px-3 py-1 rounded-full border border-cyan-300 mb-2">
                        Secure Institutional Access
                    </span>

                    <h1 className="text-2xl font-black text-slate-950 tracking-tight">
                        {settings.schoolName || 'SchoolSphere International'}
                    </h1>

                    <p className="text-xs text-slate-600 mt-1 font-normal">
                        Sign in with your username and password to access your dashboard.
                    </p>

                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2.5 animate-in fade-in">

                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />

                        <span>{error}</span>

                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Username */}
                    <div>

                        <div className="flex items-center justify-between mb-1.5">

                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Username
                            </label>

                        </div>

                        <div className="relative">

                            <User className="w-4 h-4 text-cyan-600 absolute left-3.5 top-1/2 -translate-y-1/2" />

                            <input
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                placeholder="Enter your username"
                                required
                                autoComplete="username"
                                className="w-full pl-10 pr-4 py-2.5 bg-cyan-50/50 border border-cyan-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-400/20 transition shadow-inner"
                            />

                        </div>

                    </div>

                    {/* Password */}
                    <div>

                        <div className="flex items-center justify-between mb-1.5">

                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Password
                            </label>

                        </div>

                        <div className="relative">

                            <Lock className="w-4 h-4 text-cyan-600 absolute left-3.5 top-1/2 -translate-y-1/2" />

                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                className="w-full pl-10 pr-10 py-2.5 bg-cyan-50/50 border border-cyan-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:bg-white focus:ring-2 focus:ring-cyan-400/20 transition shadow-inner"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-700 p-1"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>

                        </div>

                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between text-xs pt-1">

                        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 hover:text-slate-900 font-medium">

                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />

                            <span>Remember me</span>

                        </label>

                        <button
                            type="button"
                            onClick={() => setForgotModalOpen(true)}
                            className="text-cyan-700 hover:text-cyan-900 font-bold transition"
                        >
                            Forgot password?
                        </button>

                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 text-sm font-black rounded-xl shadow-lg shadow-cyan-500/25 border border-cyan-300 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >

                        {loading ? (
                            <span className="flex items-center gap-2">

                                <span className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />

                                <span>Authenticating Session...</span>

                            </span>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />

                                <span>Sign In to SchoolSphere</span>
                            </>
                        )}

                    </button>

                </form>

                {/* Security Footer */}
                <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-center gap-2 text-[11px] text-slate-500">

                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />

                    <span>256-Bit SSL Encrypted Enterprise Session</span>

                </div>

            </div>

            {/* Forgot Password Modal */}
            {forgotModalOpen && (

                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">

                    <div className="w-full max-w-md bg-white border-2 border-cyan-300 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">

                        <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center mx-auto">
                            <KeyRound className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-slate-950 text-center">
                            Institutional Password Reset
                        </h3>

                        <p className="text-xs text-slate-600 text-center leading-relaxed font-normal">
                            For academic data security, faculty and student credentials must be verified through the SchoolSphere IT Administrator.
                        </p>

                        <div className="p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-xs space-y-1 text-slate-700">

                            <p>
                                <strong>IT Support:</strong> it-helpdesk@schoolsphere.com
                            </p>

                            <p>
                                <strong>Admin Desk:</strong> +1 (800) 555-SPHERE
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() => setForgotModalOpen(false)}
                            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
                        >
                            Understood, Close
                        </button>

                    </div>

                </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-500 z-10">
                &copy; {new Date().getFullYear()} SchoolSphere Management System. All rights reserved.
            </div>

        </div>
    );
};
