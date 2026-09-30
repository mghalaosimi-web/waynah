'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/auth-context';
import { Card, Button, Badge, EmptyState } from '@waynah/ui';
import { 
  Compass, 
  Bookmark, 
  FileText, 
  Search, 
  MapPin, 
  UserCheck, 
  Sparkles, 
  ArrowLeft, 
  ShieldCheck,
  Building2,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { apiClient, type FavoriteItem, type ServiceRequestItem } from '../../../lib/api/api-client';
import { PlaceCard } from '../../../components/domain/PlaceCard';

export default function ClientDashboardPage() {
  const { actor, user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadMetrics() {
      const [favRes, reqRes] = await Promise.all([
        apiClient.getFavorites(),
        apiClient.getRequests(),
      ]);

      if (mounted) {
        if (favRes.success && favRes.data) setFavorites(favRes.data);
        if (reqRes.success && reqRes.data) setRequests(reqRes.data);
        setLoading(false);
      }
    }

    loadMetrics();

    return () => {
      mounted = false;
    };
  }, []);

  const getActorTitle = () => {
    switch (actor.type) {
      case 'USER':
        return 'مستكشف موثق';
      case 'BUSINESS_MEMBER':
        return 'صاحب أعمال ومرافق';
      case 'ADMIN':
        return 'مدير منصة وينه؟';
      case 'ANONYMOUS':
      default:
        return 'زائر جديد';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white p-6 sm:p-8 shadow-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>أهلاً بك في منصة "وينه؟" الاستكشافية</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              مرحباً، {user?.name || (actor.id === 'anonymous' ? 'زائرنا العزيز' : actor.id)}
            </h2>

            <p className="text-sm text-emerald-100/90 leading-relaxed">
              صفحتك الشخصية توفر لك وصولاً سريعاً للمواقع الجغرافية الموثوقة، متابعة طلباتك المحفوظة، وتخصيص تجربة الاستكشاف في محافظة حجة واليمن.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link href="/search">
              <Button
                variant="primary"
                size="md"
                className="gap-2 bg-white text-emerald-800 hover:bg-emerald-50 border-none font-extrabold w-full sm:w-auto shadow-md"
              >
                <Search className="w-4 h-4 text-emerald-700" />
                <span>ابحث عن مكان</span>
              </Button>
            </Link>

            <Link href="/map">
              <Button
                variant="outline"
                size="md"
                className="gap-2 text-white border-white/40 hover:bg-white/10 font-bold w-full sm:w-auto"
              >
                <MapPin className="w-4 h-4 text-emerald-300" />
                <span>استعرض الخريطة</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Activity Overview Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Saved Places */}
        <Card className="p-5 space-y-3 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الأماكن المحفوظة</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <Bookmark className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {loading ? '...' : favorites.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">مكان</span>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <Link href="/favorites" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-between">
              <span>عرض القائمة</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Metric 2: Requests */}
        <Card className="p-5 space-y-3 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الطلبات المقدمة</span>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {loading ? '...' : requests.length}
            </span>
            <span className="text-xs font-semibold text-slate-400">طلب</span>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <Link href="/requests" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between">
              <span>عرض الطلبات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

        {/* Metric 3: Geospatial Scope */}
        <Card className="p-5 space-y-3 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">نطاق الاستكشاف</span>
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">محافظة حجة</span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">قابلة للتوسع لمحافظات اليمن</p>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مواقع مغطاة وموثقة</span>
            </span>
          </div>
        </Card>

        {/* Metric 4: Identity Status */}
        <Card className="p-5 space-y-3 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">حالة الهوية</span>
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/70 text-teal-600 dark:text-teal-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate block">
              {getActorTitle()}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
              {actor.type}
            </p>
          </div>
          <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
            <Link href="/profile" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center justify-between">
              <span>تفاصيل الملف</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>

      </div>

      {/* Main Dashboard Grid: Saved Places Preview & Recent Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Saved Places & Quick Shortcuts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Saved Places Card Block */}
          <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                  <Bookmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    الأماكن والمرافق المحفوظة مؤخراً
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    وصول سريع إلى أماكنك المفضلة
                  </p>
                </div>
              </div>

              <Link href="/favorites">
                <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl">
                  عرض الكل ({favorites.length})
                </Button>
              </Link>
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.slice(0, 2).map((fav) => (
                  <PlaceCard
                    key={fav.id}
                    id={fav.place.id}
                    nameAr={fav.place.nameAr}
                    nameEn={fav.place.nameEn}
                    categoryNameAr={fav.place.categoryNameAr ?? undefined}
                    districtNameAr={fav.place.districtNameAr ?? undefined}
                    address={fav.place.address}
                    verificationStatus={fav.place.verificationStatus}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="لم تحفظ أي أماكن بعد"
                description="تستطيع إضافة المرافق، المتاجر، والمراكز الطبية إلى المفضلة للوصول إليها بسرعة في أي وقت."
                action={
                  <Link href="/search">
                    <Button variant="primary" size="sm" className="gap-1.5 font-bold rounded-xl">
                      <Search className="w-4 h-4" />
                      <span>استكشف الأماكن الآن</span>
                    </Button>
                  </Link>
                }
              />
            )}
          </Card>

          {/* Quick Action Shortcuts */}
          <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              اختصارات منصة الاستكشاف
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <Link href="/search" className="group p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  البحث الجغرافي
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  بحث بالاسم، الحي، والتصنيف بحس مكاني.
                </p>
              </Link>

              <Link href="/map" className="group p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-teal-500/50 hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400">
                  الخريطة التفاعلية
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  استعراض النطاق المكاني للأماكن والخدمات.
                </p>
              </Link>

              <Link href="/categories" className="group p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 hover:border-amber-500/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all space-y-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Building2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  دليل التصنيفات
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تصفح الصحة، التغذية، الخدمات والتعليم.
                </p>
              </Link>

            </div>
          </Card>

        </div>

        {/* Right Column: Identity & Recent Activity Info */}
        <div className="space-y-6">
          
          {/* Identity & Permissions Card */}
          <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
              <span>تفاصيل هوية الحساب</span>
              <Badge variant="emerald" size="sm">
                مفعل
              </Badge>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">معرف المستكشف:</span>
                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{actor.id}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">نوع الهوية:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{actor.type}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400">الأدوار الممنوحة:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {actor.roles.join(', ') || 'عام'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <span className="text-slate-500 dark:text-slate-400 block font-semibold">الصلاحيات النشطة:</span>
                <div className="flex flex-wrap gap-1">
                  {actor.permissions.map((perm) => (
                    <span key={perm} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      {perm}
                    </span>
                  ))}
                  {actor.permissions.length === 0 && (
                    <span className="text-[10px] text-slate-400 italic">صلاحيات تصفح عادية</span>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/profile">
                <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl">
                  إدارة إعدادات الملف
                </Button>
              </Link>
            </div>
          </Card>

          {/* User Requests Summary */}
          <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                طلبات الخدمة والسرعة
              </h3>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            <div className="text-center py-4 space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لم تقم بتقديم طلبات إضافة أماكن أو اقتراح تصحيحات مكانية بعد.
              </p>
              <Link href="/requests">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  الانتقال إلى سجل الطلبات ←
                </span>
              </Link>
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
