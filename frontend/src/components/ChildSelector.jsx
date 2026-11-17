import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Users, ChevronDown, Check } from 'lucide-react';

export const ChildSelector = () => {
  const { role, childrenList, activeChild, switchActiveChild } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (role !== 'parent' || !childrenList || childrenList.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-left hover:bg-gray-100 transition shadow-xs"
      >
        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          {activeChild?.profileImage ? (
            <img src={activeChild.profileImage} alt={activeChild.name} className="w-full h-full object-cover" />
          ) : (
            <Users className="w-4 h-4 text-white" />
          )}
        </div>
        <div>
          <div className="text-[10px] text-gray-500 font-bold leading-none uppercase tracking-wider">Active Student</div>
          <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
            {activeChild?.name || 'Select Child'}
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-gray-200 text-gray-800">
              {activeChild?.classGrade} - {activeChild?.section}
            </span>
          </div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2 border-b border-gray-100 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Switch Student ({childrenList.length})
            </div>
            {childrenList.map((child) => {
              const isSelected = activeChild?._id === child._id;
              return (
                <button
                  key={child._id}
                  onClick={() => {
                    switchActiveChild(child);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition ${
                    isSelected ? 'bg-gray-50 border-l-4 border-gray-900' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        child.profileImage ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
                      }
                      alt={child.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{child.name}</div>
                      <div className="text-xs text-gray-500">
                        {child.classGrade} - {child.section} &bull; Roll: {child.rollNumber}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
