import React from 'react';
import '../styles/globals.css';
import { AuthProvider } from '../lib/auth/auth-context';

export const metadata = {
  title: 'وينه؟ — WAYNAH Discovery Engine',
  description: 'منصة استكشاف الأماكن والخدمات المحلية في المملكة العربية السعودية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="rtl">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
