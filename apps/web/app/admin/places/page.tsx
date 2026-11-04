'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, RefreshCw, Search } from 'lucide-react';
import { Button, Container, PageHeader } from '@waynah/ui';
import {
  apiClient,
  type AdminPlaceListItem,
  type AdminPlaceStatus,
} from '../../../lib/api/api-client';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<AdminPlaceStatus, string> = {
  VERIFIED: 'موثق',
  UNVERIFIED: 'غير موثق',
  CLAIMED: 'مطالب به',
  REPORTED: 'مبلّغ عنه',
  CLOSED: 'مغلق',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ar-YE', { dateStyle: 'medium' }).format(date);
}

export default function AdminPlacesPage() {
  const [places, setPlaces] = useState<AdminPlaceListItem[]>([]);
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<AdminPlaceStatus | ''>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getAdminPlaces({
        query: query || undefined,
        status: status || undefined,
        page,
        limit: PAGE_SIZE,
      });

      if (response.success && response.data) {
        setPlaces(response.data);
        const totalFromMeta = response.meta?.total;
        const totalPagesFromMeta = response.meta?.totalPages;
        setTotal(typeof totalFromMeta === 'number' ? totalFromMeta : response.data.length);
        setTotalPages(
          typeof totalPagesFromMeta === 'number'
            ? totalPagesFromMeta
            : response.data.length === PAGE_SIZE
              ? page + 1
              : page
        );
      } else {
        setPlaces([]);
        setTotal(0);
        setTotalPages(0);
        setError(
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'تعذر تحميل قائمة الأماكن.'
        );
      }
    } catch {
      setPlaces([]);
      setTotal(0);
      setTotalPages(0);
      setError('تعذر الاتصال بخدمة الإدارة. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setQuery(queryInput.trim());
  };

  const statusClass = (value: AdminPlaceStatus) => {
    if (value === 'VERIFIED') return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200';
    if (value === 'REPORTED') return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200';
    if (value === 'CLOSED') return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300';
    return 'border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200';
  };

  return (
    <Container size="xl" className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="إدارة الأماكن"
          subtitle="استعراض سجلات الأماكن وحالات التوثيق وسجل المعرفة المرتبط بها."
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => void loadPlaces()}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row">
        <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">البحث عن مكان</span>
          <input
            value={queryInput}
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="ابحث باسم المكان..."
            className="min-h-11 w-full bg-transparent text-sm outline-none"
            maxLength={120}
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">الحالة</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as AdminPlaceStatus | '');
              setPage(1);
            }}
            className="min-h-11 min-w-36 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <Button type="submit" size="sm" className="min-h-11 gap-2">
          <Search className="h-4 w-4" aria-hidden="true" />
          بحث
        </Button>
      </form>

      <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{loading ? 'جارٍ تحميل السجلات…' : `إجمالي النتائج: ${total.toLocaleString('ar-YE')}`}</span>
        <span>الصفحة {page.toLocaleString('ar-YE')} من {Math.max(totalPages, 1).toLocaleString('ar-YE')}</span>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      )}

      {!loading && !error && places.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950">
          لا توجد سجلات مطابقة للبحث الحالي.
        </div>
      )}

      {!loading && !error && places.length > 0 && (
        <div className="space-y-3">
          {places.map((place) => (
            <article key={place.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-slate-900 dark:text-white">{place.nameAr}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(place.verificationStatus)}`}>
                    {STATUS_LABELS[place.verificationStatus]}
                  </span>
                </div>
                {place.nameEn && <p className="text-xs text-slate-500" dir="ltr">{place.nameEn}</p>}
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {[place.category?.nameAr, place.district?.nameAr, place.district?.governorate?.nameAr]
                    .filter(Boolean)
                    .join(' · ') || 'التصنيف والمنطقة غير متاحين'}
                </p>
                {place.address && <p className="text-xs text-slate-500">{place.address}</p>}
                <p className="text-xs text-slate-400">آخر تحديث: {formatDate(place.updatedAt)}</p>
              </div>

              <Link
                href={`/admin/places/${place.id}/history`}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-700 dark:border-slate-700 dark:text-slate-200"
              >
                سجل المكان
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            السابق
          </Button>
          <span className="text-xs tabular-nums text-slate-500">{page.toLocaleString('ar-YE')} / {totalPages.toLocaleString('ar-YE')}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            التالي
          </Button>
        </div>
      )}
    </Container>
  );
}
