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

    const handleUsernameChange = (e) => {
        setUsername(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, from]);

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
                    'Welcome to DevSkill SchoolSphere Portal',
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
        <div className="min-h-screen bg-[#FFF1EB] text-[#1E232F] flex flex-col justify-center items-center p-4 sm:p-6 relative selection:bg-[#FF5E3A] selection:text-white font-sans overflow-x-hidden">

            {/* Background Ambient Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-[#FF5E3A]/8 blur-[140px] pointer-events-none z-0" />
                <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#00B074]/8 blur-[140px] pointer-events-none z-0" />
            </div>

            {/* Top Bar */}
            <div className="w-full max-w-md mb-4 flex items-center justify-between text-xs z-10">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-[#5A6272] hover:text-[#FF5E3A] font-bold transition group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to DevSkill Home</span>
                </Link>

                <span className="text-[#FF5E3A] font-bold">
                    Session 2026–2027
                </span>
            </div>

            {/* Main Login Card */}
            <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-[#FF5E3A]/8 border-2 border-[#FEEAE1] z-10 animate-fade-up">

                {/* Header */}
                <div className="text-center mb-7">
                    <div className="w-14 h-14 rounded-2xl bg-[#FF5E3A] p-0.5 shadow-lg shadow-[#FF5E3A]/30 mx-auto mb-3.5 flex items-center justify-center text-white">
                        <GraduationCap className="w-7 h-7" />
                    </div>

                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#FF5E3A] bg-[#FFF0EB] px-3.5 py-1 rounded-full border border-[#FEEAE1] mb-2">
                        Secure Institutional Access
                    </span>

                    <h1 className="text-2xl font-black text-[#1E232F] tracking-tight">
                        {settings.schoolName || 'DevSkill SchoolSphere'}
                    </h1>

                    <p className="text-xs text-[#5A6272] mt-1 font-normal">
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
                            <label className="block text-xs font-bold text-[#5A6272] uppercase tracking-wider">
                                Username
                            </label>
                        </div>

                        <div className="relative">
                            <User className="w-4 h-4 text-[#FF5E3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={username}
                                onChange={handleUsernameChange}
                                placeholder="Enter your username"
                                required
                                autoComplete="username"
                                className="w-full pl-10 pr-4 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-sm text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-2 focus:ring-[#FF5E3A]/20 transition shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-bold text-[#5A6272] uppercase tracking-wider">
                                Password
                            </label>
                        </div>

                        <div className="relative">
                            <Lock className="w-4 h-4 text-[#FF5E3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={handlePasswordChange}
                                placeholder="Enter your password"
                                required
                                autoComplete="current-password"
                                className="w-full pl-10 pr-10 py-2.5 bg-[#FFF6F2] border border-[#FEEAE1] rounded-xl text-sm text-[#1E232F] placeholder-slate-400 focus:outline-none focus:border-[#FF5E3A] focus:bg-white focus:ring-2 focus:ring-[#FF5E3A]/20 transition shadow-inner"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#FF5E3A] p-1 cursor-pointer"
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
                        <label className="flex items-center gap-2 cursor-pointer select-none text-[#5A6272] hover:text-[#1E232F] font-medium">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 rounded border-[#FEEAE1] text-[#FF5E3A] focus:ring-[#FF5E3A]"
                            />
                            <span>Remember me</span>
                        </label>

                        <button
                            type="button"
                            onClick={() => setForgotModalOpen(true)}
                            className="text-[#FF5E3A] hover:text-[#E84E2A] font-bold transition cursor-pointer"
                        >
                            Forgot password?
                        </button>
                    </div>

                    {/* Login Button in DevSkill Emerald Green or Orange */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-3 py-3 px-4 bg-[#FF5E3A] hover:bg-[#E84E2A] text-white text-sm font-extrabold rounded-full shadow-lg shadow-[#FF5E3A]/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Authenticating Session...</span>
                            </span>
                        ) : (
                            <>
                                <LogIn className="w-4 h-4" />
                                <span>Sign In to DevSkill Portal</span>
                            </>
                        )}
                    </button>

                </form>

                {/* Security Footer */}
                <div className="mt-6 pt-4 border-t border-[#FEEAE1] flex items-center justify-center gap-2 text-[11px] text-[#5A6272]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#00B074]" />
                    <span>256-Bit SSL Encrypted Enterprise Session</span>
                </div>

            </div>

            {/* Forgot Password Modal */}
            {forgotModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-md bg-white border-2 border-[#FEEAE1] rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl">
                        <div className="w-12 h-12 rounded-2xl bg-[#FFF0EB] text-[#FF5E3A] flex items-center justify-center mx-auto">
                            <KeyRound className="w-6 h-6" />
                        </div>

                        <h3 className="text-lg font-bold text-[#1E232F] text-center">
                            Institutional Password Reset
                        </h3>

                        <p className="text-xs text-[#5A6272] text-center leading-relaxed font-normal">
                            For academic data security, faculty and student credentials must be verified through the SchoolSphere IT Administrator.
                        </p>

                        <div className="p-3.5 rounded-xl bg-[#FFF6F2] border border-[#FEEAE1] text-xs space-y-1 text-[#5A6272]">
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
                            className="w-full py-2.5 bg-[#FF5E3A] hover:bg-[#E84E2A] text-white font-bold text-xs rounded-full shadow-md transition"
                        >
                            Understood, Close
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-[#5A6272] z-10">
                &copy; {new Date().getFullYear()} DevSkill • SchoolSphere. All rights reserved.
            </div>

        </div>
    );
};

export default Login;
