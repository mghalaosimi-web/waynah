'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth/auth-context';
import { Button } from '@waynah/ui';
import { 
  Compass, 
  MapPin, 
  Search, 
  User, 
  LogOut, 
  LogIn, 
  UserPlus, 
  Menu, 
  X, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';

interface ClientHeaderProps {
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const ClientHeader: React.FC<ClientHeaderProps> = ({
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { actor, user, isAuthenticated, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  const getRoleLabel = (type: string) => {
    switch (type) {
      case 'USER':
        return 'مستخدم مسجل';
      case 'BUSINESS_MEMBER':
        return 'صاحب أعمال';
      case 'ADMIN':
        return 'مدير النظام';
      case 'SYSTEM':
        return 'خدمة نظام';
      case 'ANONYMOUS':
      default:
        return 'زائر (غير مسجل)';
    }
  };

  const userDisplayName = user?.name || (actor.type !== 'ANONYMOUS' ? actor.id : 'زائر');
  const userInitials = user?.name
    ? user.name.slice(0, 2).toUpperCase()
    : actor.type !== 'ANONYMOUS'
    ? actor.id.slice(0, 2).toUpperCase()
    : '?';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              aria-label="قائمة الملاحة"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                    وينه؟
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    تجربة العميل
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
                  بوابة المستخدم المسجل
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Cross-Navigation (Public UX Connection) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-semibold">
            <Link
              href="/search"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>البحث الجغرافي</span>
            </Link>
            <Link
              href="/map"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>الخريطة التفاعلية</span>
            </Link>
          </div>

          {/* User Identity & Auth State Area */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  aria-expanded={userDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs border border-emerald-700/40">
                    {userInitials}
                  </div>

                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                      {userDisplayName}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {getRoleLabel(actor.type)}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* User Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-850 shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in-50 zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {user?.email || actor.id}
                      </p>
                    </div>

                    <div className="space-y-0.5 px-1.5">
                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>الملف الشخصي والحساب</span>
                      </Link>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 px-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full text-right px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>دخول</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm" className="gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white border-none">
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>حساب جديد</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
