'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  Database,
  Layers3,
  MapPin,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button, Container, PageHeader } from '@waynah/ui';
import { apiClient, type AdminAnalyticsOverview } from '../../../lib/api/api-client';

const numberFormat = new Intl.NumberFormat('ar-YE');

function formatNumber(value: number) {
  return numberFormat.format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'تاريخ غير متاح';
  return new Intl.DateTimeFormat('ar-YE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAdminAnalyticsOverview();
      if (response.success && response.data) {
        setOverview(response.data);
      } else {
        setError(
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'تعذر تحميل التحليلات.'
        );
      }
    } catch {
      setError('تعذر الاتصال بخدمة التحليلات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const summary = overview?.summary;
  const verifiedRate = summary && summary.placesTotal > 0
    ? Math.round((summary.placesVerified / summary.placesTotal) * 100)
    : 0;

  const metrics = summary
    ? [
        { label: 'الأماكن المسجلة', value: summary.placesTotal, icon: MapPin, hint: 'إجمالي الأماكن في قاعدة البيانات' },
        { label: 'الأماكن الموثقة', value: summary.placesVerified, icon: ShieldCheck, hint: 'حالة التوثيق VERIFIED' },
        { label: 'الأنشطة التجارية', value: summary.businessesTotal, icon: Building2, hint: 'الأنشطة المسجلة' },
        { label: 'النزاعات المفتوحة', value: summary.openConflictsTotal, icon: AlertTriangle, hint: 'تحتاج إلى مراجعة إدارية' },
        { label: 'الملاحظات المعلقة', value: summary.observationsPending, icon: Activity, hint: 'بانتظار المعالجة' },
        { label: 'مصادر البيانات', value: summary.dataSourcesTotal, icon: Database, hint: 'مصادر رصد البيانات' },
        { label: 'التصنيفات', value: summary.categoriesTotal, icon: Layers3, hint: 'التصنيفات المسجلة' },
        { label: 'التقييمات', value: summary.reviewsTotal, icon: MessageSquare, hint: 'إجمالي التقييمات' },
      ]
    : [];

  return (
    <Container size="xl" className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="تحليلات النظام"
          subtitle="مؤشرات فعلية من قاعدة البيانات وسجل العمليات، دون بيانات تجريبية."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadOverview()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading && !overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      )}

      {summary && (
        <>
          <section aria-label="مؤشرات النظام" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{metric.label}</p>
                      <p className="mt-3 text-3xl font-black tabular-nums text-slate-950 dark:text-white">
                        {loading ? '…' : formatNumber(metric.value)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{metric.hint}</p>
                    </div>
                    <span className="rounded-xl bg-teal-50 p-3 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="font-bold text-slate-900 dark:text-white">جودة بيانات الأماكن</h2>
              </div>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-black tabular-nums text-slate-950 dark:text-white">{formatNumber(summary.placesVerified)}</p>
                  <p className="mt-1 text-xs text-slate-500">مكان موثق من أصل {formatNumber(summary.placesTotal)}</p>
                </div>
                <p className="text-2xl font-bold tabular-nums text-teal-700 dark:text-teal-300">{verifiedRate}%</p>
              </div>
              <div
                className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
                role="progressbar"
                aria-label="نسبة الأماكن الموثقة"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={verifiedRate}
              >
                <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${verifiedRate}%` }} />
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300">
                <span>موثقة: {formatNumber(summary.placesVerified)}</span>
                <span>غير موثقة: {formatNumber(summary.placesUnverified)}</span>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="font-bold text-slate-900 dark:text-white">نشاط الإدارة</h2>
              </div>
              <p className="mt-3 text-3xl font-black tabular-nums text-slate-950 dark:text-white">
                {formatNumber(summary.auditEventsLast7Days)}
              </p>
              <p className="mt-1 text-xs text-slate-500">عملية مسجلة خلال آخر 7 أيام</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">الملاحظات الكلية</p>
                  <p className="mt-1 font-bold tabular-nums">{formatNumber(summary.observationsTotal)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900">
                  <p className="text-xs text-slate-500">المناطق الإدارية</p>
                  <p className="mt-1 font-bold tabular-nums">{formatNumber(summary.governoratesTotal)} محافظة · {formatNumber(summary.districtsTotal)} مديرية</p>
                </div>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white">آخر العمليات المسجلة</h2>
                <p className="mt-1 text-xs text-slate-500">سجل مختصر لا يعرض عناوين IP أو بيانات تعريف حساسة.</p>
              </div>
              <span className="text-xs text-slate-500">آخر 8 عمليات</span>
            </div>

            {overview.recentAuditEvents.length === 0 ? (
              <div className="mt-5 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-900">
                لا توجد عمليات مسجلة حتى الآن.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {overview.recentAuditEvents.map((event) => (
                  <div key={event.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100">{event.eventType}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {[event.action, event.resourceType, event.resourceId].filter(Boolean).join(' · ') || 'تفاصيل إضافية غير متاحة'}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-500" dateTime={event.createdAt}>
                      {formatDate(event.createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>

          <p className="text-xs text-slate-500">
            آخر تحديث: {formatDate(overview.generatedAt)} · نافذة النشاط: آخر {overview.periodDays} أيام.
          </p>
        </>
      )}

      {!loading && !error && !overview && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          لا توجد بيانات متاحة لعرضها.
        </div>
      )}
    </Container>
  );
}
