import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingAPI } from '../services/api.js';

const SchoolContext = createContext(null);

export const SchoolProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    schoolName: 'SchoolSphere International Academy',
    schoolMotto: 'Excellence in Global Education • Leadership & Innovation',
    address: '100 Academic Blvd, International Education District',
    phone: '+1 (555) 019-2834',
    email: 'admissions@schoolsphere.com',
    website: 'https://schoolsphere.edu',
    academicYear: '2026-2027',
    currency: '$'
  });

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await settingAPI.get();
        if (res.success && res.data) {
          setSettings(res.data);
        }
      } catch (err) {
        console.warn('Could not load dynamic settings, using defaults:', err.message);
      }
    };
    fetchSettings();
  }, []);

  const showToast = (message, type = 'info', title = '') => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type, title }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const updateSchoolSettings = async (newData) => {
    try {
      const res = await settingAPI.update(newData);
      if (res.success && res.data) {
        setSettings(res.data);
        showToast('School configuration updated successfully', 'success', 'Saved');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message, 'error', 'Update Failed');
      return { success: false, error: err.message };
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        settings,
        updateSchoolSettings,
        showToast,
        toasts,
        removeToast
      }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border-2 transition-all duration-300 transform translate-y-0 flex items-start justify-between bg-slate-900 ${
              toast.type === 'success'
                ? 'border-emerald-500 shadow-emerald-500/20'
                : toast.type === 'error'
                ? 'border-rose-500 shadow-rose-500/20'
                : 'border-cyan-500 shadow-cyan-500/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : toast.type === 'error'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-cyan-500/20 text-cyan-400'
                }`}
              >
                {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
              </div>
              <div>
                {toast.title && <h5 className="font-extrabold text-sm mb-0.5 text-white tracking-tight">{toast.title}</h5>}
                <p className="text-xs text-slate-300 font-medium leading-relaxed">{toast.message}</p>
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white text-xs ml-3 p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
};
