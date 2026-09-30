'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiClient, type BusinessItem } from '../../../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  Building2,
  Store,
  MapPin,
  Calendar,
  Layers,
  ChevronLeft,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function PublicBusinessProfilePage() {
  const params = useParams();
  const idOrSlug = params?.id as string;
  const [business, setBusiness] = useState<BusinessItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (idOrSlug) {
      setIsLoading(true);
      apiClient
        .getPublicBusinessProfile(idOrSlug)
        .then((res) => {
          if (res.success && res.data) {
            setBusiness(res.data);
          } else {
            setError('النشاط التجاري غير موجود');
          }
        })
        .catch(() => {
          setError('فشل تحميل بيانات النشاط التجاري');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [idOrSlug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-8 space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse w-1/4" />
        <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center space-y-4 bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">النشاط التجاري غير موجود</h2>
        <p className="text-xs text-slate-500">{error || 'لم يتم العثور على الصفحة المطلوبة'}</p>
        <Link href="/search">
          <Button variant="outline" size="sm" className="rounded-xl font-bold">
            العودة لاستكشاف الأماكن
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Public Header Card */}
      <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">الملف التجاري العام</span>
          <span>•</span>
          <span>منصة وينه؟</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {business.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" />
                  نشاط موثق
                </span>
              </div>
              {business.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  {business.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 text-[11px]">تاريخ الانضمام</span>
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{new Date(business.createdAt).toLocaleDateString('ar-SA')}</span>
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[11px]">عدد المواقع المشغلة</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
              <Store className="w-3.5 h-3.5" />
              <span>{business.totalPlaces || business.places?.length || 0} موقع</span>
            </p>
          </div>
        </div>

      </div>

      {/* Conceptual Distinction Callout Banner */}
      <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
        <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-300">
          <Layers className="w-4 h-4" />
          <span>المفهوم الجغرافي المعماري (Business vs Place):</span>
        </div>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
          <strong>النشاط التجاري (Business):</strong> يمثل الجهة المشغلة والمالكة لخدمات الرعاية والأعمال.<br />
          <strong>المكان الجغرافي (Place):</strong> يمثل الفرع أو الكيان الجغرافي المكتشف على الخريطة المكانية.
        </p>
      </div>

      {/* Associated Places List */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>المواقع والفروع التابعة للنشاط ({business.places?.length || 0})</span>
        </h2>

        {(!business.places || business.places.length === 0) ? (
          <div className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-2">
            <Store className="w-8 h-8 text-slate-400 mx-auto opacity-50" />
            <p className="font-bold">لا توجد فروع مرتبطة بهذا النشاط حالياً</p>
            <p className="text-[11px] text-slate-400">سيتم ربط الفروع والمواقع الجغرافية في المراحل المعمارية القادمة (Branch Domain).</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {business.places.map((place) => (
              <div
                key={place.id}
                className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {place.nameAr}
                    </h3>
                    {place.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {place.address}
                      </p>
                    )}
                  </div>
                  <Link href={`/places/${place.id}`}>
                    <Button variant="outline" size="sm" className="text-[11px] p-1.5 rounded-lg">
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
