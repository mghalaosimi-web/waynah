'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, EmptyState, Skeleton, ErrorState } from '@waynah/ui';
import { 
  Bookmark, 
  Search, 
  MapPin, 
  Sparkles, 
  Building2, 
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { apiClient, type FavoriteItem } from '../../../lib/api/api-client';
import { PlaceCard } from '../../../components/domain/PlaceCard';

export default function ClientFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    const res = await apiClient.getFavorites();
    setLoading(false);

    if (res.success && res.data) {
      setFavorites(res.data);
    } else {
      setError(
        typeof res.error === 'string' 
          ? res.error 
          : res.error?.message || 'تعذر تحميل قائمة الأماكن المحفوظة'
      );
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const handleRemoveFavorite = async (placeId: string) => {
    setRemovingId(placeId);
    const res = await apiClient.removeFavorite(placeId);
    setRemovingId(null);

    if (res.success) {
      setFavorites((prev) => prev.filter((item) => item.placeId !== placeId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                الأماكن والمرافق المحفوظة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                سجل المواقع والخدمات المفضلة لديك للوصول المباشر إليها
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="emerald" size="sm" className="font-mono">
              {loading ? '...' : `${favorites.length} مكان محفوظ`}
            </Badge>
          </div>
        </div>

        {/* Public ↔ Client Integration Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>كيف تقوم بحفظ الأماكن في المفضلة؟</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            عند تصفح البحث الجغرافي أو الخريطة التفاعلية، انقر على زر "حفظ إلى المفضلة" الموجود في تفاصيل المكان لإضافته تلقائياً إلى هذه القائمة.
          </p>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-3">
              <Skeleton variant="text" className="h-6 w-3/4" />
              <Skeleton variant="text" className="h-4 w-1/2" />
              <Skeleton variant="rectangular" className="h-24 rounded-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="عفواً، تعذر جلب المفضلة"
          message={error}
          onRetry={fetchFavorites}
        />
      )}

      {/* Empty State */}
      {!loading && !error && favorites.length === 0 && (
        <Card className="p-8 sm:p-12 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-center space-y-6">
          <EmptyState
            title="لم تحفظ أي أماكن بعد"
            description="استكشف الأماكن والمرافق في محافظة حجة، ثم قم بإضافتها للمفضلة لسهولة التصفح لاحقاً."
            action={
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href="/search">
                  <Button variant="primary" size="md" className="gap-2 font-extrabold rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                    <Search className="w-4 h-4" />
                    <span>استكشف الأماكن الآن</span>
                  </Button>
                </Link>

                <Link href="/map">
                  <Button variant="outline" size="md" className="gap-2 font-bold rounded-xl w-full sm:w-auto">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>عرض الخريطة التفاعلية</span>
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      )}

      {/* Favorites List Grid */}
      {!loading && !error && favorites.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
              <PlaceCard
                id={fav.place.id}
                nameAr={fav.place.nameAr}
                nameEn={fav.place.nameEn}
                categoryNameAr={fav.place.categoryNameAr ?? undefined}
                districtNameAr={fav.place.districtNameAr ?? undefined}
                address={fav.place.address}
                verificationStatus={fav.place.verificationStatus}
              />

              <div className="mt-2 flex items-center justify-between gap-2">
                <Link href={`/places/${fav.place.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs font-bold gap-1.5 rounded-xl border-slate-200 hover:border-emerald-500 hover:text-emerald-600"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>زيارة المكان</span>
                  </Button>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={removingId === fav.placeId}
                  onClick={() => handleRemoveFavorite(fav.placeId)}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl gap-1"
                >
                  {removingId === fav.placeId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>إزالة</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggested Categories to Explore */}
      <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          تصنيفات مقترحة للاستكشاف والحفظ
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Link href="/search?categoryId=health" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-colors space-y-1 block">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>المستشفيات والرعاية الصحية</span>
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500">المراكز الطبية والصيدليات المعتمدة في حجة</p>
          </Link>

          <Link href="/search?categoryId=food" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-colors space-y-1 block">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>المطاعم والمقاهي</span>
              <Building2 className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-500">أشهر المطاعم المحلية والمشروبات</p>
          </Link>

          <Link href="/search?categoryId=services" className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-colors space-y-1 block">
            <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
              <span>الخدمات العامة والتسوق</span>
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-[11px] text-slate-500">المحلات التجارية والخدمات الحكومية والمحلية</p>
          </Link>
        </div>
      </Card>
    </div>
  );
}
