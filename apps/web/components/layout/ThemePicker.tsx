'use client';

import React, { useState, useEffect } from 'react';

export type ThemeAccent = 'teal' | 'ocean' | 'indigo' | 'emerald' | 'rose' | 'amber';
export type ThemeMode = 'light' | 'dark';

export interface ThemeOption {
  id: ThemeAccent;
  nameAr: string;
  colorHex: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'teal', nameAr: 'وينه تيال (افتراضي)', colorHex: '#0F766E' },
  { id: 'ocean', nameAr: 'أزرق المحيط', colorHex: '#0284C7' },
  { id: 'indigo', nameAr: 'إنديغو نيل', colorHex: '#4F46E5' },
  { id: 'emerald', nameAr: 'زمردي', colorHex: '#059669' },
  { id: 'rose', nameAr: 'ورد حريضي', colorHex: '#E11D48' },
  { id: 'amber', nameAr: 'عنبري دافئ', colorHex: '#D97706' },
];

export const ThemePicker: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [accent, setAccent] = useState<ThemeAccent>('teal');
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    // Read saved theme from localStorage
    const savedAccent = (localStorage.getItem('waynah_theme_accent') as ThemeAccent) || 'teal';
    const savedMode = (localStorage.getItem('waynah_theme_mode') as ThemeMode) || 'light';
    
    applyAccent(savedAccent);
    applyMode(savedMode);
  }, []);

  const applyAccent = (newAccent: ThemeAccent) => {
    setAccent(newAccent);
    document.documentElement.setAttribute('data-theme-accent', newAccent);
    localStorage.setItem('waynah_theme_accent', newAccent);
  };

  const applyMode = (newMode: ThemeMode) => {
    setMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode);
    localStorage.setItem('waynah_theme_mode', newMode);
  };

  return (
    <div className="relative inline-block text-right">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
        title="تخصيص لون الواجهة والمظهر"
      >
        <span
          className="w-3.5 h-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 shadow-sm"
          style={{ backgroundColor: THEME_OPTIONS.find((t) => t.id === accent)?.colorHex || '#0F766E' }}
        />
        <span className="hidden sm:inline">المظهر</span>
        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">مظهر الواجهة</span>
              <span className="text-[10px] text-slate-500">الهوية ثابتة</span>
            </div>

            {/* Mode Switcher (Light / Dark) */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-500">النمط البصري:</span>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => applyMode('light')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'light'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>☀️ فاتح</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyMode('dark')}
                  className={`py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    mode === 'dark'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <span>🌙 داكن</span>
                </button>
              </div>
            </div>

            {/* Color Accent Picker */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-500">لون الثيمة المخصص:</span>
              <div className="grid grid-cols-1 gap-1">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = accent === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => {
                        applyAccent(theme.id);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs transition-all ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-slate-700/80 font-bold text-slate-900 dark:text-white'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full shadow-sm shrink-0 border border-black/10"
                          style={{ backgroundColor: theme.colorHex }}
                        />
                        <span>{theme.nameAr}</span>
                      </div>
                      {isSelected && <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
