'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, EmptyState, Skeleton, ErrorState } from '@waynah/ui';
import { 
  FileText, 
  PlusCircle, 
  Search, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  ShieldCheck, 
  Info,
  ArrowRight,
  Loader2,
  X,
  Building2,
  AlertCircle
} from 'lucide-react';
import { apiClient, type ServiceRequestItem } from '../../../lib/api/api-client';

export default function ClientRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    const res = await apiClient.getRequests();
    setLoading(false);

    if (res.success && res.data) {
      setRequests(res.data);
    } else {
      setError(
        typeof res.error === 'string'
          ? res.error
          : res.error?.message || 'تعذر تحميل سجل الطلبات'
      );
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('يرجى إدخال عنوان الطلب والتفاصيل كاملة');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const res = await apiClient.createRequest({
      title: title.trim(),
      description: description.trim(),
      placeId: placeId.trim() ? placeId.trim() : null,
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setRequests((prev) => [res.data, ...prev]);
      setTitle('');
      setDescription('');
      setPlaceId('');
      setShowModal(false);
    } else {
      setFormError(
        typeof res.error === 'string'
          ? res.error
          : res.error?.message || 'فشل في إرسال الطلب، يرجى المحاولة مرة أخرى'
      );
    }
  };

  const getStatusBadge = (status: ServiceRequestItem['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="emerald" size="sm">مكتمل ✅</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="gold" size="sm">قيد المعالجة ⏳</Badge>;
      case 'CANCELLED':
        return <Badge variant="red" size="sm">ملغى ❌</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="gray" size="sm">قيد الانتظار 🕒</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                سجل طلبات العميل والمتابعة
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة طلبات إضافة الأماكن، اقتراح التصحيحات المكانيّة، والاستفسارات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="gray" size="sm" className="font-mono">
              {loading ? '...' : `${requests.length} طلب`}
            </Badge>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
              className="gap-2 font-bold bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <PlusCircle className="w-4 h-4" />
              <span>طلب جديد</span>
            </Button>
          </div>
        </div>

        {/* Informational UX Banner */}
        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 text-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>نظام الطلبات الجغرافية في منصة "وينه؟"</span>
          </div>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            تستطيع من خلال هذا السجل تقديم ومتابعة طلبات إضافة المواقع الجديدة، الإبلاغ عن تغيير بيانات متجر أو مرفق، ومتابعة حالات التدقيق من فريق النزاهة المكانية.
          </p>
        </div>
      </Card>

      {/* New Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <span>تقديم طلب جديد</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  عنوان الطلب *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: طلب إضافة مستوصف الأمل في حي السلام"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  تفاصيل الطلب *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="يرجى كتابة التفاصيل، مثل رقم التواصل، المكان الدقيق، أو التغييرات المطلوبة..."
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  معرف المكان المرتبط (اختياري)
                </label>
                <input
                  type="text"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="اتركه فارغاً إذا كان الطلب لإضافة مكان جديد"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl font-bold"
                >
                  إلغاء
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 font-bold rounded-xl gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الإرسال...</span>
                    </>
                  ) : (
                    <span>إرسال الطلب</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i} className="p-6 space-y-3">
              <Skeleton variant="text" className="h-6 w-1/2" />
              <Skeleton variant="text" className="h-4 w-3/4" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="تعذر تحميل الطلبات"
          message={error}
          onRetry={fetchRequests}
        />
      )}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <Card className="p-8 sm:p-12 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-center space-y-6">
          <EmptyState
            title="لا توجد طلبات سابقة"
            description="لم تقم بتقديم أي طلبات إضافة مكان جديد أو تصحيح بيانات مكانيّة حتى الآن."
            action={
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setShowModal(true)}
                  className="gap-2 font-extrabold rounded-xl bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>تقديم طلب جديد الآن</span>
                </Button>

                <Link href="/search">
                  <Button variant="outline" size="md" className="gap-2 font-bold rounded-xl w-full sm:w-auto">
                    <Search className="w-4 h-4 text-blue-600" />
                    <span>استكشف الأماكن الحالية</span>
                  </Button>
                </Link>
              </div>
            }
          />
        </Card>
      )}

      {/* Requests List */}
      {!loading && !error && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {req.title}
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  {getStatusBadge(req.status)}
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(req.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {req.description}
              </p>

              {req.place && (
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-slate-500">المكان المرتبط:</span>
                  <Link href={`/places/${req.place.id}`} className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline">
                    {req.place.nameAr}
                  </Link>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Future Request Types Roadmap */}
      <Card className="p-6 bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
          أنواع الطلبات المتاحة للمستخدم المسجل
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-slate-900 dark:text-white font-extrabold">
              <span>طلب إضافة مكان جديد</span>
              <PlusCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إرسال إحداثيات ومستندات مرفق أو متجر محلي لإضافته لدليل حجة الجغرافي.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-slate-900 dark:text-white font-extrabold">
              <span>طلب تصحيح بيانات مكانيّة</span>
              <ShieldCheck className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              الإبلاغ عن تغير رقم هاتف، انتقال موقع، أو تغيير ساعات العمل.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-slate-900 dark:text-white font-extrabold">
              <span>طلب استفسار أو دعم</span>
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              التواصل مع فريق المنصة بخصوص الخدمات والمواقع المسجلة.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
