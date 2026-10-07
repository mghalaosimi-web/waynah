'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../lib/auth/auth-context';
import { apiClient, type BusinessItem, type BusinessVerificationData } from '../../../lib/api/api-client';
import { Button } from '@waynah/ui';
import { TeamSection } from '../../../components/domain/TeamSection';
import { CatalogSection } from '../../../components/domain/CatalogSection';
import { TransactionSection } from '../../../components/domain/TransactionSection';
import { FulfillmentSection } from '../../../components/domain/FulfillmentSection';
import {
  Building2,
  PlusCircle,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Briefcase,
  Users,
  Store,
  Calendar,
  Sparkles,
  ExternalLink,
  Clock,
  AlertCircle,
  FileCheck,
  ChevronRight,
  Layers
} from 'lucide-react';

export default function BusinessDashboardPage() {
  const { actor, user, isAuthenticated, isLoading: authLoading, refreshAuth } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form State for Business Creation
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>('');
  const [descriptionInput, setDescriptionInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Active section tab (team management, catalog, transactions, fulfillment)
  const [activeSection, setActiveSection] = useState<'overview' | 'catalog' | 'team' | 'transactions' | 'fulfillment'>('overview');

  // Verification State
  const [verification, setVerification] = useState<BusinessVerificationData | null>(null);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  const [verificationNotes, setVerificationNotes] = useState<string>('');
  const [verificationSubmitting, setVerificationSubmitting] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const fetchVerification = useCallback(async (businessId: string) => {
    setVerificationLoading(true);
    setVerificationError(null);
    try {
      const res = await apiClient.getBusinessVerification(businessId);
      if (res.success && res.data) {
        setVerification(res.data);
      } else {
        setVerification({
          id: null,
          businessId,
          status: 'UNVERIFIED',
        });
      }
    } catch {
      setVerification({
        id: null,
        businessId,
        status: 'UNVERIFIED',
      });
    } finally {
      setVerificationLoading(false);
    }
  }, []);

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getMyBusinesses();
      if (res.success && res.data) {
        setBusinesses(res.data);
        if (res.data.length > 0) {
          setSelectedBusiness(res.data[0]);
        }
      } else if (!res.success && typeof res.error === 'string') {
        setError(res.error);
      }
    } catch {
      setError('حدث خطأ في تحميل بيانات النشاط التجاري');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchBusinesses();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchBusinesses]);

  useEffect(() => {
    if (selectedBusiness) {
      fetchVerification(selectedBusiness.id);
    } else if (businesses.length > 0) {
      fetchVerification(businesses[0].id);
    }
  }, [selectedBusiness, businesses, fetchVerification]);

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentBiz = selectedBusiness || businesses[0];
    if (!currentBiz) return;
    setVerificationSubmitting(true);
    setVerificationError(null);
    try {
      const res = await apiClient.submitBusinessVerification(currentBiz.id, {
        notes: verificationNotes.trim() || undefined,
      });

      if (res.success && res.data) {
        setVerification(res.data);
        setVerificationNotes('');
      } else {
        const msg =
          typeof res.error === 'object' && res.error?.message
            ? res.error.message
            : typeof res.error === 'string'
            ? res.error
            : 'فشل تقديم طلب التوثيق';
        setVerificationError(msg);
      }
    } catch {
      setVerificationError('حدث خطأ أثناء التواصل مع خادم API');
    } finally {
      setVerificationSubmitting(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!nameInput || nameInput.trim().length < 2) {
      setCreateError('يرجى إدخال اسم نشاط تجاري صحيح (حرفين على الأقل)');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createBusiness({
        name: nameInput.trim(),
        description: descriptionInput.trim() || undefined,
      });

      if (res.success && res.data) {
        setNameInput('');
        setDescriptionInput('');
        setShowCreateForm(false);
        await refreshAuth(); // Refresh actor role to BUSINESS_OWNER if needed
        await fetchBusinesses();
      } else {
        const errMsg =
          typeof res.error === 'object' && res.error?.message
            ? res.error.message
            : typeof res.error === 'string'
            ? res.error
            : 'فشل في إنشاء النشاط التجاري';
        setCreateError(errMsg);
      }
    } catch {
      setCreateError('حدث خطأ أثناء التواصل مع خادم API');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading State
  if (authLoading || isLoading) {
    return (
      <div className="p-8 space-y-4 max-w-5xl mx-auto">
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse w-1/3" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
      </div>
    );
  }

  // 2. Unauthenticated State
  if (!isAuthenticated || actor.type === 'ANONYMOUS') {
    return (
      <div className="p-8 max-w-4xl mx-auto bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center space-y-6 shadow-sm">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            منصة ومساحة أصحاب الأعمال والأنشطة
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            يتطلب تأسيس أو إدارة نشاطك التجاري على WAYNAH تسجيل الدخول بحساب موثق.
          </p>
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login?redirect=/business">
            <Button variant="primary" className="font-bold px-6 py-2.5 rounded-xl">
              تسجيل الدخول الآن
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 3. User Has No Business (Creation Flow UX)
  if (businesses.length === 0 || showCreateForm) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>تأسيس نشاط تجاري جديد</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              أضف نشاطك التجاري إلى منصة وينه؟
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              قم بتأسيس الهوية الرسمية لنشاطك، لربط الفروع الجغرافية والخدمات المستقبلية بالجهة المشغلة مباشرة.
            </p>
          </div>
        </div>

        {/* Creation Form */}
        <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  بيانات النشاط التجاري الأولي
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Business Entity Registration
                </p>
              </div>
            </div>

            {businesses.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="text-xs rounded-xl"
              >
                إلغاء
              </Button>
            )}
          </div>

          {createError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleCreateBusiness} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                اسم النشاط التجاري / المؤسسة <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="مثال: مجموعة الشفاء الطبية، أو صيدليات الأمل"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                وصف النشاط ومجال العمل (اختياري)
              </label>
              <textarea
                rows={3}
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                placeholder="اكتب نبذة مختصرة عن الخدمات والمجالات التي يقدمها نشاطك..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              />
            </div>

            {/* Architecture Concept Callout */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                <Layers className="w-4 h-4" />
                <span>ملاحظة معمارية (Business ≠ Place):</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                `Business` هو الكيان القانوني أو الجهة المشغلة. الفروع والمواقع الجغرافية (`Place`) تُرتبط مستقبلاً بهذا النشاط.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="w-full font-extrabold py-3.5 rounded-2xl gap-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
              >
                {isSubmitting ? (
                  <span>جاري الإنشاء والتأسيس...</span>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>تأسيس وإنشاء النشاط التجاري</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 4. Main Business Dashboard View
  const currentBiz = selectedBusiness || businesses[0];

  return (
    <div className="space-y-6">
      
      {/* Top Selector & Action Bar */}
      <div className="bg-white dark:bg-slate-850 p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {currentBiz.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {currentBiz.status === 'ACTIVE' ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              معرّف النشاط: <span className="font-mono text-slate-700 dark:text-slate-300">{currentBiz.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {businesses.length > 1 && (
            <select
              value={currentBiz.id}
              onChange={(e) => {
                const found = businesses.find((b) => b.id === e.target.value);
                if (found) setSelectedBusiness(found);
              }}
              className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateForm(true)}
            className="gap-1.5 text-xs font-bold rounded-xl"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>إضافة نشاط آخر</span>
          </Button>

          <Link href={`/business/public/${currentBiz.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold rounded-xl">
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>الصفحة العامة</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Business Identity Card & Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Identity Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>تفاصيل الهوية التجارية</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              الدور: {currentBiz.membershipRole === 'OWNER' ? 'مالك النشاط (OWNER)' : currentBiz.membershipRole || 'عضو'}
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-slate-400 font-medium">اسم النشاط</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">{currentBiz.name}</p>
            </div>

            {currentBiz.description && (
              <div>
                <p className="text-xs text-slate-400 font-medium">الوصف ومجال العمل</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {currentBiz.description}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-[11px] text-slate-400">تاريخ التأسيس</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(currentBiz.createdAt).toLocaleDateString('ar-SA')}</span>
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">الرابط المخصص (Slug)</p>
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {currentBiz.slug || currentBiz.id}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats / Status Summary */}
        <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 tracking-wider">حالة التوثيق والنطاق</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <p className="text-2xl font-black">
                {verification?.status === 'VERIFIED'
                  ? 'نشاط موثّق'
                  : verification?.status === 'PENDING'
                  ? 'بانتظار المراجعة'
                  : verification?.status === 'REJECTED'
                  ? 'طلب مرفوض'
                  : 'غير موثّق'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {verification?.status === 'VERIFIED'
                  ? 'تم اعتماد وتوثيق الهوية التشغيلية لهذا النشاط بنجاح.'
                  : verification?.status === 'PENDING'
                  ? 'طلب التوثيق قيد التدقيق الإداري حالياً.'
                  : 'السجل التجاري قائم ولكن لم يتم توثيقه بعد.'}
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-1">
            <div className="flex items-center justify-between text-slate-300 font-bold">
              <span>الفروع المرتبطة</span>
              <span className="text-emerald-400">{currentBiz.places?.length || 0} موقع</span>
            </div>
          </div>
        </div>

      </div>

      {/* Dedicated Business Verification Section (WAYNAH-BUSINESS-002 UX) */}
      <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                توثيق النشاط التجاري
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                حالة توثيق هوية المشغل وطلب الاعتماد الرسمي
              </p>
            </div>
          </div>

          {/* Status Indicator Badge */}
          <div>
            {verification?.status === 'VERIFIED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>موثّق</span>
              </span>
            )}
            {verification?.status === 'PENDING' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>بانتظار المراجعة</span>
              </span>
            )}
            {verification?.status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>مرفوض</span>
              </span>
            )}
            {(!verification || verification.status === 'UNVERIFIED') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300/40 dark:border-slate-700">
                <span>غير موثّق</span>
              </span>
            )}
          </div>
        </div>

        {verificationError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{verificationError}</span>
          </div>
        )}

        {/* Verification Status UI Panels */}
        {verificationLoading ? (
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        ) : verification?.status === 'VERIFIED' ? (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>النشاط التجاري موثّق</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              تمت مراجعة وتأكيد هوية وملكية نشاطك التجاري بنجاح بواسطة السلطة المختصة.
            </p>
          </div>
        ) : verification?.status === 'PENDING' ? (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-300">
              <Clock className="w-5 h-5 text-amber-600" />
              <span>طلب التحقق قيد المراجعة</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              تم استلام طلب التوثيق الخاص بنشاطك التجاري وهو حالياً قيد المراجعة من قبل الفريق الإداري.
            </p>
            {verification.submittedAt && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                تاريخ تقديم الطلب: {new Date(verification.submittedAt).toLocaleDateString('ar-SA')}
              </p>
            )}
            <Button disabled variant="outline" size="sm" className="opacity-60 text-xs font-bold rounded-xl cursor-not-allowed">
              الطلب قيد المراجعة حالياً
            </Button>
          </div>
        ) : (
          /* UNVERIFIED or REJECTED */
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            {verification?.status === 'REJECTED' && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>تم رفض طلب التحقق</span>
                </div>
                {verification.rejectionReason && (
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">
                    سبب الرفض: {verification.rejectionReason}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {verification?.status === 'REJECTED' ? 'إعادة تقديم طلب التحقق' : 'وثّق نشاطك التجاري'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                تقديم طلب التحقق لإثبات ملكية الهوية التجارية والحصول على الشارة المعتمدة.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                ملاحظات أو بيان مساند لطلب التحقق (اختياري)
              </label>
              <textarea
                rows={2}
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات توضيحية..."
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={verificationSubmitting}
              className="font-bold px-6 py-2.5 rounded-xl text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              {verificationSubmitting ? (
                <span>جاري إرسال الطلب...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>{verification?.status === 'REJECTED' ? 'إعادة تقديم طلب التحقق' : 'طلب التحقق'}</span>
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Future Modules Section (Clear Badges - Deferred Architecture) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              وحدات وإمكانيات منصة الأعمال
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              خارطة طريق تطوير خدمات أصحاب الأنشطة والخدمات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Card 1: Branches */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                قريباً (Branches)
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                الفروع والمواقع الجغرافية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                ربط المواقع الجغرافية والفروع المكتشفة (`Place`) بالنشاط التجاري وتحديث بياناتها.
              </p>
            </div>
          </div>

          {/* Card 2: Catalog — Now Active (Phase 5) */}
          <button
            onClick={() => setActiveSection('catalog')}
            className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden group hover:border-blue-500/40 hover:shadow-md transition-all text-right w-full cursor-pointer"
            aria-label="الانتقال إلى كتالوج المنتجات والخدمات"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl">
                <Store className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                متاح الآن (Catalog)
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                كتالوج الخدمات والمنتجات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                إضافة وقوائم الخدمات المقدمة والمنتجات المتاحة وتفاصيل الأسعار.
              </p>
            </div>
          </button>

          {/* Card 3: Verification */}
          <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-600 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                مرحلة لاحقة (Verification)
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                توثيق السجل التجاري
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                رفع وثائق السجل والتحقق الأمني لإعطاء العلامة الموثقة الرسمية للنشاط.
              </p>
            </div>
          </div>

          {/* Card 4: Orders & Transactions — Now Active (Phase 6) */}
          <button
            onClick={() => setActiveSection('transactions')}
            className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden group hover:border-purple-500/40 hover:shadow-md transition-all text-right w-full cursor-pointer"
            aria-label="الانتقال إلى إدارة الطلبات والحجوزات"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                متاح الآن (Transactions)
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                إدارة الطلبات والحجوزات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                استقبال طلبات العملاء المباشرة، وتلقي الاستفسارات، وإدارة طلبات التسعير (RFQ)، والحجوزات، والطلبات المالية.
              </p>
            </div>
          </button>

          {/* Card 5: Members — Now Active */}
          <button
            onClick={() => setActiveSection('team')}
            className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden group hover:border-emerald-500/40 hover:shadow-md transition-all text-right w-full cursor-pointer"
            aria-label="الانتقال إلى إدارة فريق العمل"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                متاح الآن (Team)
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                فريق العمل والصلاحيات
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                دعوة وتعيين مدراء وأعضاء للنشاط التجاري وتحديد الصلاحيات.
              </p>
            </div>
          </button>

          {/* Card 6: Fulfillment & Payments — Now Active (Phase 7) */}
          <button
            onClick={() => setActiveSection('fulfillment')}
            className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 relative overflow-hidden group hover:border-teal-500/40 hover:shadow-md transition-all text-right w-full cursor-pointer"
            aria-label="الانتقال إلى إدارة الوفاء والتسليم والحدود المالية"
          >
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-teal-500/10 text-teal-600 rounded-xl">
                <FileCheck className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                متاح الآن (Fulfillment)
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                الوفاء والتسليم والحدود المالية
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                إدارة أنماط الوفاء والتوصيل الميداني، إثبات الاكتمال (OTP)، وتتبع حالات السداد والحدود المالية.
              </p>
            </div>
          </button>

        </div>
      </div>

      {/* ─── Fulfillment & Payments Section (Phase 7) ──────────────────── */}
      {activeSection === 'fulfillment' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                إدارة الوفاء والتسليم والحدود المالية
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                متابعة التسليم الميداني وإثبات الاكتمال وإقرار السداد لنشاط: {currentBiz.name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('overview')}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>العودة للوحة الرئيسية</span>
            </Button>
          </div>
          <FulfillmentSection businessId={currentBiz.id} />
        </div>
      )}

      {/* ─── Transactions & Orders Section (Phase 6) ───────────────────── */}
      {activeSection === 'transactions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                إدارة التعهدات والطلبات
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                الطلبات والحجوزات والاستفسارات التابعة لنشاط: {currentBiz.name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('overview')}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>العودة للوحة الرئيسية</span>
            </Button>
          </div>
          <TransactionSection businessId={currentBiz.id} />
        </div>
      )}

      {/* ─── Catalog Management Section (Phase 5) ───────────────────────── */}
      {activeSection === 'catalog' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                إدارة كتالوج العرض
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                المنتجات المادية والخدمات التابعة لنشاط: {currentBiz.name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('overview')}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>العودة للوحة الرئيسية</span>
            </Button>
          </div>
          <CatalogSection
            businessId={currentBiz.id}
            currentMembershipRole={(currentBiz.membershipRole as 'OWNER' | 'MANAGER' | 'MEMBER') || 'MEMBER'}
            actor={actor}
          />
        </div>
      )}

      {/* ─── Team Management Section ─────────────────────────────────────── */}
      {activeSection === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                إدارة فريق العمل
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أعضاء الفريق والدعوات المعلقة لنشاط: {currentBiz.name}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveSection('overview')}
              className="gap-1.5 text-xs font-bold rounded-xl"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>العودة للوحة الرئيسية</span>
            </Button>
          </div>
          <TeamSection
            businessId={currentBiz.id}
            currentMembershipRole={(currentBiz.membershipRole as 'OWNER' | 'MANAGER' | 'MEMBER') || 'MEMBER'}
            actor={actor}
          />
        </div>
      )}

    </div>
  );
}
