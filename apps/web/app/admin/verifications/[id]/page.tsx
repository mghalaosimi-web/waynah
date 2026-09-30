'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, type BusinessVerificationData } from '../../../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  Users,
  MapPin,
  ArrowRight,
  Send,
  XCircle,
  Briefcase
} from 'lucide-react';

export default function AdminVerificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [verification, setVerification] = useState<BusinessVerificationData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Review Form Action State
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  const fetchVerification = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getAdminVerificationById(id);
      if (res.success && res.data) {
        setVerification(res.data);
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'لم يتم العثور على طلب التوثيق المطلوب';
        setError(msg);
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const handleReview = async (targetStatus: 'VERIFIED' | 'REJECTED') => {
    setReviewError(null);
    setReviewSuccessMsg(null);

    if (targetStatus === 'REJECTED' && (!rejectionReason || rejectionReason.trim().length === 0)) {
      setReviewError('يرجى كتابة سبب الرفض المسبب قبل التأكيد');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.reviewBusinessVerification(id, {
        status: targetStatus,
        rejectionReason: targetStatus === 'REJECTED' ? rejectionReason.trim() : undefined,
      });

      if (res.success && res.data) {
        setVerification(res.data);
        setShowRejectInput(false);
        setRejectionReason('');
        setReviewSuccessMsg(
          targetStatus === 'VERIFIED'
            ? 'تم اعتماد وتوثيق النشاط التجاري بنجاح'
            : 'تم رفض طلب التوثيق وتسجيل السبب الإداري بنجاح'
        );
      } else {
        const msg = typeof res.error === 'object' && res.error?.message ? res.error.message : 'فشل تنفيذ عملية المراجعة';
        setReviewError(msg);
      }
    } catch {
      setReviewError('حدث خطأ أثناء التواصل مع API');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-6">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">خطأ في العثور على الطلب</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error || 'لم يتم العثور على الطلب'}</p>
        <Link href="/admin/verifications">
          <Button variant="outline" size="sm" className="font-bold text-xs rounded-xl">
            العودة لطابور التوثيق
          </Button>
        </Link>
      </div>
    );
  }

  const biz = verification.business;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/admin/verifications" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <ArrowRight className="w-4 h-4" />
          <span>العودة لطابور المراجعة</span>
        </Link>

        {/* Status Badge */}
        <div>
          {verification.status === 'VERIFIED' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>النشاط موثّق (VERIFIED)</span>
            </span>
          )}
          {verification.status === 'PENDING' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>قيد المراجعة (PENDING)</span>
            </span>
          )}
          {verification.status === 'REJECTED' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>الطلب مرفوض (REJECTED)</span>
            </span>
          )}
        </div>
      </div>

      {reviewSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{reviewSuccessMsg}</span>
        </div>
      )}

      {reviewError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{reviewError}</span>
        </div>
      )}

      {/* Business Details Card */}
      <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white">
              {biz?.name || 'بيانات النشاط التجاري'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
              معرّف النشاط: {verification.businessId} | Slug: {biz?.slug || 'لا يوجد'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-3">
            <div>
              <span className="text-slate-400 font-medium">الوصف ومجال العمل:</span>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">
                {biz?.description || 'لا يوجد وصف مضاف'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">حالة النشاط في النظام:</span>
              <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                {biz?.status === 'ACTIVE' ? 'نشط (ACTIVE)' : 'غير نشط'}
              </p>
            </div>
          </div>

          <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>ملاحظات طلب التوثيق المرفوعة:</span>
            </div>
            <p className="text-slate-700 dark:text-slate-300 italic font-mono leading-relaxed">
              {verification.notes ? `"${verification.notes}"` : 'لم يتم إرفاق ملاحظات مع الطلب.'}
            </p>
            {verification.submittedAt && (
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                تاريخ تقديم الطلب: {new Date(verification.submittedAt).toLocaleString('ar-SA')}
              </p>
            )}
          </div>
        </div>

        {/* Places Linked */}
        {biz?.places && biz.places.length > 0 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>الفروع والمواقع المكانية المرتبطة ({biz.places.length}):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {biz.places.map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{p.nameAr}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{p.address || p.id.slice(0, 8)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verification Action Panel (Interactive Review for Admin) */}
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                قرار مراجعة التوثيق الإداري (Server-Authoritative Review)
              </h2>
              <p className="text-xs text-slate-400">
                تحديد الاعتماد الرسمي للهوية التجارية في منصة وينه؟
              </p>
            </div>
          </div>
        </div>

        {verification.status === 'VERIFIED' && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
            <p className="font-bold">تم اعتماد وتوثيق هذا النشاط التجاري</p>
            {verification.reviewedAt && (
              <p className="text-[11px] text-slate-400">
                تاريخ الاعتماد: {new Date(verification.reviewedAt).toLocaleString('ar-SA')}
              </p>
            )}
          </div>
        )}

        {verification.status === 'REJECTED' && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
            <p className="font-bold">تم رفض طلب التوثيق لهذا النشاط</p>
            {verification.rejectionReason && (
              <p className="text-xs text-rose-200 font-mono">
                سبب الرفض المسجل: {verification.rejectionReason}
              </p>
            )}
            {verification.reviewedAt && (
              <p className="text-[11px] text-slate-400 pt-1">
                تاريخ الرفض: {new Date(verification.reviewedAt).toLocaleString('ar-SA')}
              </p>
            )}
          </div>
        )}

        {/* PENDING State Action Controls */}
        {verification.status === 'PENDING' && (
          <div className="space-y-5">
            {!showRejectInput ? (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  variant="primary"
                  disabled={isSubmitting}
                  onClick={() => handleReview('VERIFIED')}
                  className="w-full sm:w-auto font-bold px-8 py-3 rounded-2xl text-xs gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد التوثيق (Approve Verification)</span>
                </Button>

                <Button
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setShowRejectInput(true)}
                  className="w-full sm:w-auto font-bold px-8 py-3 rounded-2xl text-xs gap-2 border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
                >
                  <XCircle className="w-4 h-4" />
                  <span>رفض الطلب (Reject Verification)</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-4 p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    <span>تأكيد رفض طلب التوثيق (يتطلب تسبيب إداري)</span>
                  </h3>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    إلغاء
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                    سبب الرفض المسبب (سيظهر لمالك النشاط) <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="اكتب سبب عدم قبول طلب التوثيق موضحاً النواقص..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    disabled={isSubmitting || !rejectionReason.trim()}
                    onClick={() => handleReview('REJECTED')}
                    className="font-bold px-6 py-2.5 rounded-xl text-xs gap-2 bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>تأكيد تسجيل الرفض</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowRejectInput(false)}
                    className="text-xs font-bold rounded-xl border-slate-700 text-slate-300"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
