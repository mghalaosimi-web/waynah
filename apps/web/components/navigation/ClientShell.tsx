'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnverifiedAccountBanner } from '../auth/UnverifiedAccountBanner';
import { useAuth } from '../../lib/auth/auth-context';
import { ClientHeader } from './ClientHeader';
import { ClientSidebar } from './ClientSidebar';
import { Button, Container } from '@waynah/ui';
import { AlertCircle, UserCheck, Search, ChevronLeft, Home } from 'lucide-react';

interface ClientShellProps {
  children: React.ReactNode;
}

export const ClientShell: React.FC<ClientShellProps> = ({ children }) => {
  const pathname = usePathname();
  const { actor } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Generate page title and breadcrumbs based on route
  const getPageContext = () => {
    if (pathname.startsWith('/business')) {
      return { title: 'منصة إدارة النشاط التجاري', breadcrumb: 'النشاط التجاري' };
    }
    switch (pathname) {
      case '/dashboard':
        return { title: 'لوحة التحكم الرئيسي', breadcrumb: 'لوحة التحكم' };
      case '/profile':
        return { title: 'الملف الشخصي والحساب', breadcrumb: 'الملف الشخصي' };
      case '/favorites':
        return { title: 'الأماكن والمرافق المحفوظة', breadcrumb: 'المفضلة' };
      case '/requests':
        return { title: 'متابعة طلبات الخدمات والمواقع', breadcrumb: 'الطلبات' };
      default:
        return { title: 'منطقة العميل', breadcrumb: 'العميل' };
    }
  };

  const context = getPageContext();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Email Verification Alert Banner */}
      <UnverifiedAccountBanner />

      {/* Client Shell Top Header */}
      <ClientHeader
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMobileMenuOpen={mobileMenuOpen}
      />

      {/* Main Body Layout: Sidebar + Content */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-22 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm h-[calc(100vh-7rem)]">
            <ClientSidebar />
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Sidebar drawer panel */}
            <div className="relative flex-1 max-w-xs w-full bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
              <ClientSidebar onNavClick={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Top Breadcrumb & Title Bar */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Link href="/" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  <span>وينه؟</span>
                </Link>
                <ChevronLeft className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {context.breadcrumb}
                </span>
              </nav>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {context.title}
              </h1>
            </div>

            {/* Public search action pill */}
            <div className="flex items-center gap-2">
              <Link href="/search">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
                  <Search className="w-3.5 h-3.5 text-slate-500" />
                  <span>استكشف الأماكن</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Anonymous User Warning Notice (Auth/Unauthorized State UX) */}
          {actor.type === 'ANONYMOUS' && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-extrabold">تتصفح حالياً بصفة زائر (غير مسجل)</p>
                  <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                    بعض الخصائص التفاعلية مثل حفظ المفضلة ومتابعة الطلبات تتطلب تسجيل الدخول بحساب مستخدم مفعل.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-1.5 text-xs font-bold w-full sm:w-auto rounded-xl bg-amber-600 hover:bg-amber-700 text-white border-none"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول الآن</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Page Body Children */}
          <div className="space-y-6">
            {children}
          </div>

        </main>
      </div>

    </div>
  );
};
