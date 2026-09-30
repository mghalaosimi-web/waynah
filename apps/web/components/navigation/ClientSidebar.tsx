'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-context';
import { 
  LayoutDashboard, 
  User, 
  Bookmark, 
  FileText, 
  Building2,
  Search, 
  MapPin, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles,
  ChevronLeft
} from 'lucide-react';

interface ClientSidebarProps {
  onNavClick?: () => void;
  className?: string;
}

export const ClientSidebar: React.FC<ClientSidebarProps> = ({
  onNavClick,
  className = '',
}) => {
  const pathname = usePathname();
  const { actor } = useAuth();

  const navigationItems = [
    {
      label: 'لوحة التحكم',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'ملخص النشاط والتنقل السريع',
    },
    {
      label: 'النشاط التجاري',
      href: '/business',
      icon: Building2,
      description: 'إدارة وتأسيس الأعمال والخدمات',
    },
    {
      label: 'الملف الشخصي',
      href: '/profile',
      icon: User,
      description: 'بيانات الحساب والهوية الرقمية',
    },
    {
      label: 'الأماكن المحفوظة',
      href: '/favorites',
      icon: Bookmark,
      description: 'المرافق والأماكن المضافة للمفضلة',
    },
    {
      label: 'متابعة الطلبات',
      href: '/requests',
      icon: FileText,
      description: 'سجل الطلبات والاستفسارات المكانية',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <aside className={`flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200/80 dark:border-slate-800 ${className}`}>
      
      {/* Client Context Title */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            قائمة العميل المسجل
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            نشط
          </span>
        </div>
      </div>

      {/* Main Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={`group flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-bold ${
                active
                  ? 'bg-emerald-500/10 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-r-4 border-emerald-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    active
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-right">
                  <span>{item.label}</span>
                  <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400 line-clamp-1">
                    {item.description}
                  </span>
                </div>
              </div>

              <ChevronLeft
                className={`w-4 h-4 transition-transform ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400 -translate-x-0.5'
                    : 'text-slate-400 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0'
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Public Shortcuts & Identity Badge */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40 space-y-3">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 px-1 uppercase">
            اختصارات الاستكشاف العام
          </p>

          <Link
            href="/search"
            onClick={onNavClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>البحث بالأماكن والخدمات</span>
          </Link>

          <Link
            href="/map"
            onClick={onNavClick}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span>استعراض الخريطة المكانية</span>
          </Link>
        </div>

        {/* Identity Footer Info */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-200">
            <span className="font-bold truncate max-w-[120px]">{actor.id}</span>
            {actor.type !== 'ANONYMOUS' ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-3 h-3" />
                موثق
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                <ShieldAlert className="w-3 h-3" />
                زائر
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            الأدوار: {actor.roles.join(', ') || 'عام'}
          </p>
        </div>
      </div>

    </aside>
  );
};
