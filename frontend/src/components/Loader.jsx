import React from 'react';

export const Loader = ({ message = 'Loading data...', fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-2 border-emerald-600 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      <p className="text-sm font-medium text-slate-600 tracking-wide">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

export const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs animate-pulse">
    <div className="h-4 bg-slate-100 rounded w-1/3 mb-4"></div>
    <div className="h-8 bg-slate-100 rounded w-1/2 mb-3"></div>
    <div className="h-3 bg-slate-100 rounded w-2/3"></div>
  </div>
);
