import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container, Button } from '@waynah/ui';
import { WaynahLogo } from '../shared/WaynahLogo';
import { ThemePicker } from './ThemePicker';
import { UnverifiedAccountBanner } from '../auth/UnverifiedAccountBanner';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'الرئيسية', href: '/' },
    { label: 'البحث', href: '/search' },
    { label: 'التصنيفات', href: '/categories' },
    { label: 'الخريطة', href: '/map' },
    { label: 'لوحة التحكم', href: '/dashboard' },
  ];

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      <UnverifiedAccountBanner />
      <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <Container size="xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/">
            <WaynahLogo size="md" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Theme Picker */}
          <div className="flex items-center gap-2">
            <ThemePicker />

            <Link href="/dashboard" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 font-bold rounded-xl">
                <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>حسابي</span>
              </Button>
            </Link>

            <Link href="/search" className="hidden sm:inline-flex">
              <Button variant="primary" size="sm" className="gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>ابحث عن مكان</span>
              </Button>
            </Link>

            {/* Mobile hamburger button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
              aria-label="القائمة الرئيسية"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-lg text-base font-semibold transition-colors ${
                    active
                      ? 'bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </header>
  </>
  );
};
