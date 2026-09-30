'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@waynah/ui';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 py-12 mt-16">
      <Container size="xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-amber-600 flex items-center justify-center text-white font-bold">
                و
              </div>
              <span className="font-extrabold text-xl text-white">وينه؟ — WAYNAH</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              منصة استكشاف الأماكن والخدمات المحلية في المملكة العربية السعودية. تساعدك على معرفة أماكن الخدمات والوصول إليها بدقة وموثوقية عالية.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-primary-400 transition-colors">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-primary-400 transition-colors">
                  محرك البحث المكانية
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary-400 transition-colors">
                  دليل التصنيفات
                </Link>
              </li>
              <li>
                <Link href="/map" className="hover:text-primary-400 transition-colors">
                  الخريطة التفاعلية
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Platform */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">عن المنصة</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>المملكة العربية السعودية</li>
              <li>دليل مكاني مدعوم بالذكاء الاصطناعي</li>
              <li className="pt-2 text-xs text-slate-500">الإصدار v1.0.0 — WAYNAH-PUBLIC-001</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} مشروع وينه (WAYNAH). جميع الحقوق محفوظة.</p>
          <p className="font-mono">Spatial Intelligence & Local Discovery Platform</p>
        </div>
      </Container>
    </footer>
  );
};
