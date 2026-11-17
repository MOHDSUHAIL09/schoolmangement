import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendPositive = true,
  accent = 'emerald'
}) => {
  const iconBg =
    accent === 'aqua'
      ? 'bg-aqua-50 text-aqua-600 border-aqua-200'
      : accent === 'gold'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : accent === 'red'
      ? 'bg-red-50 text-red-600 border-red-200'
      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-aqua-300 shadow-xs hover:shadow-aqua-sm transition-all duration-200 relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-aqua-800 transition">{title}</span>
        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs transition group-hover:scale-105 ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between">
        <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        {trend && (
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              trendPositive
                ? accent === 'aqua'
                  ? 'bg-aqua-50 text-aqua-800 border-aqua-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && <p className="text-xs text-slate-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
};
