'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers3, RefreshCw, Search } from 'lucide-react';
import { Button, Container, PageHeader } from '@waynah/ui';
import { apiClient, type PlaceCategory } from '../../../lib/api/api-client';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      } else {
        setCategories([]);
        setError(
          typeof response.error === 'string'
            ? response.error
            : response.error?.message || 'تعذر تحميل التصنيفات.'
        );
      }
    } catch {
      setCategories([]);
      setError('تعذر الاتصال بخدمة التصنيفات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const categoriesById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('ar');
    if (!normalized) return categories;
    return categories.filter((category) =>
      [category.nameAr, category.nameEn || '', category.slug]
        .some((value) => value.toLocaleLowerCase('ar').includes(normalized))
    );
  }, [categories, query]);

  const filteredIds = useMemo(
    () => new Set(filteredCategories.map((category) => category.id)),
    [filteredCategories]
  );

  const roots = filteredCategories.filter(
    (category) => !category.parentId || !filteredIds.has(category.parentId)
  );

  const childrenByParent = useMemo(() => {
    const grouped = new Map<string, PlaceCategory[]>();
    for (const category of filteredCategories) {
      if (!category.parentId || !filteredIds.has(category.parentId)) continue;
      const children = grouped.get(category.parentId) || [];
      children.push(category);
      grouped.set(category.parentId, children);
    }
    return grouped;
  }, [filteredCategories, filteredIds]);

  return (
    <Container size="xl" className="space-y-6 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="شجرة التصنيفات"
          subtitle="استعراض التصنيفات الفعلية المستخدمة في دليل الأماكن، مع إظهار العلاقات بين التصنيفات الرئيسية والفرعية."
        />
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 dark:border-slate-700">
            عرض فقط
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadCategories()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center">
        <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 dark:border-slate-700">
          <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="sr-only">البحث في التصنيفات</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم التصنيف أو رمزه..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <div className="text-xs text-slate-500">
          {loading ? 'جارٍ التحميل…' : `${filteredCategories.length.toLocaleString('ar-YE')} تصنيف`}
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
          ))}
        </div>
      )}

      {!loading && !error && filteredCategories.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
          <Layers3 className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">
            {query ? 'لا توجد تصنيفات مطابقة' : 'لا توجد تصنيفات مسجلة'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {query ? 'جرّب عبارة بحث أخرى.' : 'ستظهر التصنيفات هنا عند توفرها في قاعدة البيانات.'}
          </p>
        </div>
      )}

      {!loading && !error && roots.length > 0 && (
        <div className="space-y-5">
          {roots.map((root) => {
            const children = childrenByParent.get(root.id) || [];
            const parentName = root.parentId
              ? categoriesById.get(root.parentId)?.nameAr
              : null;

            return (
              <section key={root.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                    {root.icon || <Layers3 className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-slate-900 dark:text-white">{root.nameAr}</h2>
                    {root.nameEn && <p className="text-xs text-slate-500" dir="ltr">{root.nameEn}</p>}
                    {parentName && <p className="mt-1 text-xs text-slate-500">التصنيف الأعلى: {parentName}</p>}
                  </div>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500 dark:border-slate-700">
                    {children.length.toLocaleString('ar-YE')} فرعي
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                  {children.map((child) => (
                    <div key={child.id} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base dark:bg-slate-800">
                        {child.icon || <Layers3 className="h-4 w-4 text-slate-500" aria-hidden="true" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{child.nameAr}</p>
                        {child.nameEn && <p className="truncate text-xs text-slate-500" dir="ltr">{child.nameEn}</p>}
                        <p className="truncate text-[11px] text-slate-400" dir="ltr">{child.slug}</p>
                      </div>
                    </div>
                  ))}
                  {children.length === 0 && (
                    <p className="text-sm text-slate-500">لا توجد تصنيفات فرعية مطابقة.</p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {!loading && !error && (
        <p className="text-xs text-slate-500">
          هذه الصفحة للاستعراض فقط. إنشاء التصنيفات وتعديلها وحذفها يتطلب صلاحيات ومسارات إدارة مخصصة لم تُفعّل بعد.
        </p>
      )}
    </Container>
  );
}
