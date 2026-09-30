'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  PageHeader,
  Skeleton,
  EmptyState,
  ErrorState,
} from '@waynah/ui';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { CategoryCard } from '../../../components/domain/CategoryCard';
import { apiClient, type PlaceCategory } from '../../../lib/api/api-client';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    const res = await apiClient.getCategories();
    setLoading(false);

    if (res.success && res.data) {
      setCategories(res.data);
    } else {
      setError(res.error || 'تعذر جلب قائمة التصنيفات');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryClick = (catId: string) => {
    router.push(`/search?categoryId=${catId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <Header />

      <main className="flex-1">
        <Container size="xl" className="py-8 space-y-6">
          <PageHeader
            title="دليل التصنيفات والخدمات"
            subtitle="تصفّح الأماكن والخدمات المحلية مقسّمة حسب التصنيفات القطاعية"
          />

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} variant="rectangular" className="h-16 rounded-xl" />
              ))}
            </div>
          )}

          {!loading && error && (
            <ErrorState title="تعذر تحميل التصنيفات" message={error} onRetry={fetchCategories} />
          )}

          {!loading && !error && categories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  id={cat.id}
                  nameAr={cat.nameAr}
                  onClick={handleCategoryClick}
                />
              ))}
            </div>
          )}

          {!loading && !error && categories.length === 0 && (
            <EmptyState
              title="لا توجد تصنيفات مسجلة"
              description="لم يتم العثور على تصنيفات في قاعدة البيانات الاستكشافية حالياً"
            />
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
