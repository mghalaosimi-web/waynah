'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/auth-context';
import { Card, Button, Badge } from '@waynah/ui';
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Globe, 
  MapPin, 
  Bell, 
  Sliders, 
  CheckCircle2, 
  Info,
  Shield,
  LogIn,
  UserPlus,
  LogOut
} from 'lucide-react';

export default function ClientProfilePage() {
  const { actor, user, isAuthenticated, logout } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Preference toggles state
  const [searchRadius, setSearchRadius] = useState('5000');
  const [defaultLanguage, setDefaultLanguage] = useState('ar');
  const [spatialAlerts, setSpatialAlerts] = useState(true);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const userDisplayName = user?.name || (actor.type !== 'ANONYMOUS' ? actor.id : 'زائر (غير مسجل)');
  const userInitials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : actor.type !== 'ANONYMOUS'
    ? actor.id.slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="space-y-6">
      
      {/* Header Profile Identity Overview */}
      <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-extrabold text-2xl shadow-lg shadow-emerald-500/20">
              {userInitials}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {userDisplayName}
                </h2>
                {isAuthenticated ? (
                  <Badge variant="emerald" size="sm" className="gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    مستخدم موثق
                  </Badge>
                ) : (
                  <Badge variant="gray" size="sm">
                    زائر غير مسجل
                  </Badge>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>نوع الفاعل:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{actor.type}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-xs font-bold gap-1.5 w-full sm:w-auto rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 w-full rounded-xl">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول</span>
                  </Button>
                </Link>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button variant="primary" size="sm" className="text-xs font-bold gap-1.5 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>حساب جديد</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>

        {/* Identity Attributes Contract Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Column 1: Standard System Fields */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>بيانات هوية الحساب</span>
            </h3>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">معرف الفاعل (Actor ID):</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{actor.id}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">نوع الفاعل (Actor Type):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{actor.type}</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">الأدوار (Roles):</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                  {actor.roles.join(', ') || 'ANONYMOUS'}
                </span>
              </div>

              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 dark:text-slate-400">حالة الجلسة:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isAuthenticated ? 'جلسة مشفرة وموثقة (Active Session)' : 'زائر مؤقت (Guest)'}
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: User Profile Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span>البريد الإلكتروني والبيانات الشخصية</span>
            </h3>

            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-3">
              {isAuthenticated && user ? (
                <div className="space-y-2 text-slate-700 dark:text-slate-200">
                  <div className="flex justify-between py-1 border-b border-blue-500/10">
                    <span className="text-slate-500">الاسم الكامل:</span>
                    <span className="font-bold">{user.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-500/10">
                    <span className="text-slate-500">البريد الإلكتروني:</span>
                    <span className="font-bold font-mono">{user.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-blue-500/10">
                    <span className="text-slate-500">الدور المسجل:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{user.role}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">المحافظة:</span>
                    <span className="font-bold">حجة (اليمن)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-medium">
                      أنت تتصفح حالياً كزائر غير مسجل. يرجى تسجيل الدخول أو إنشاء حساب لاستخدام جميع مميزات المنصة.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link href="/login">
                      <Button variant="primary" size="sm" className="w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
                        تسجيل الدخول إلى حسابك
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* User Preferences Form */}
      <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                تفضيلات تجربة الاستكشاف المكانية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                إعدادات البحث الافتراضية والتنبيهات الجغرافية
              </p>
            </div>
          </div>

          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-300/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              تم حفظ التفضيلات محلياً
            </span>
          )}
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            
            {/* Preference 1: Default Search Radius */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>نطاق البحث الجغرافي الافتراضي (بالأمتار):</span>
              </label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="1000">1000 متر (1 كم - نطاق قريب)</option>
                <option value="5000">5000 متر (5 كم - نطاق الحي والمدينة)</option>
                <option value="10000">10000 متر (10 كم - نطاق المديرية)</option>
                <option value="25000">25000 متر (25 كم - نطاق المحافظة)</option>
              </select>
            </div>

            {/* Preference 2: Interface Language */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span>لغة الواجهة وتنسيق العرض:</span>
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ar">العربية (RTL - الافتراضي للمنصة)</option>
                <option value="en">English (LTR)</option>
              </select>
            </div>

          </div>

          {/* Preference 3: Spatial Notifications */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>تنبيهات الأماكن القريبة والتحديثات المكانية</span>
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                إظهار إشعارات استكشاف الخدمات المستجدة في نطاق محافظة حجة
              </p>
            </div>

            <input
              type="checkbox"
              checked={spatialAlerts}
              onChange={(e) => setSpatialAlerts(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-3 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="font-extrabold rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700"
            >
              حفظ التفضيلات
            </Button>
          </div>

        </form>
      </Card>

    </div>
  );
}
