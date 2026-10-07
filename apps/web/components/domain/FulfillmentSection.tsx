'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Badge,
  Input,
  Skeleton,
} from '@waynah/ui';
import {
  Truck,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  RefreshCw,
  Clock,
  Key,
  CreditCard,
  Plus,
} from 'lucide-react';
import {
  apiClient,
  type FulfillmentItem,
  type PaymentRecordItem,
} from '../../lib/api/api-client';

interface FulfillmentSectionProps {
  businessId: string;
}

export function FulfillmentSection({ businessId }: FulfillmentSectionProps) {
  const [activeTab, setActiveTab] = useState<'fulfillments' | 'payments'>('fulfillments');

  const [fulfillments, setFulfillments] = useState<FulfillmentItem[]>([]);
  const [payments, setPayments] = useState<PaymentRecordItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // OTP Verification Modal
  const [otpFulfillmentItem, setOtpFulfillmentItem] = useState<FulfillmentItem | null>(null);
  const [inputOtp, setInputOtp] = useState('');

  // Payment Creation Modal
  const [showCreatePaymentModal, setShowCreatePaymentModal] = useState(false);
  const [payOrderId, setPayOrderId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMethod, setPayMethod] = useState<'CASH_ON_DELIVERY' | 'WALLET_TRANSFER' | 'BANK_TRANSFER'>('CASH_ON_DELIVERY');
  const [payRefNo, setPayRefNo] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFulfillmentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resFul, resPay] = await Promise.all([
        apiClient.getBusinessFulfillments(businessId),
        apiClient.getBusinessPaymentRecords(businessId),
      ]);

      if (resFul.success && resFul.data) setFulfillments(resFul.data);
      if (resPay.success && resPay.data) setPayments(resPay.data);
    } catch (_err) {
      setError('تعذر تحميل بيانات الوفاء والحدود المالية.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchFulfillmentData();
  }, [fetchFulfillmentData]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpFulfillmentItem || !inputOtp.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.verifyProofOfDelivery(businessId, otpFulfillmentItem.id, inputOtp.trim());
      if (res.success) {
        setActionSuccess('تم تأكيد إثبات الاستلام بمركز التسليم بنجاح');
        setOtpFulfillmentItem(null);
        setInputOtp('');
        fetchFulfillmentData();
      } else {
        setError(res.error?.message || 'رمز إثبات الاستلام غير صحيح');
      }
    } catch (_err) {
      setError('حدث خطأ أثناء فحص رمز إثبات الاستلام');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await apiClient.updateFulfillmentStatus(businessId, id, status);
      if (res.success) {
        setActionSuccess('تم تحديث حالة الوفاء والتوصيل بنجاح');
        fetchFulfillmentData();
      }
    } catch (_err) {
      setError('فشل في تحديث حالة الوفاء');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof payAmount !== 'number' || payAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.createPaymentRecord(businessId, {
        orderId: payOrderId || null,
        amount: payAmount,
        method: payMethod,
        referenceNumber: payRefNo || null,
      });

      if (res.success) {
        setActionSuccess('تم تسجيل المعاملة المالية بنجاح');
        setShowCreatePaymentModal(false);
        setPayOrderId('');
        setPayAmount('');
        setPayRefNo('');
        fetchFulfillmentData();
      } else {
        setError(res.error?.message || 'فشل تسجيل المعاملة المالية');
      }
    } catch (_err) {
      setError('حدث خطأ أثناء تسجيل العملية المالية');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async (id: string, status: string) => {
    try {
      const res = await apiClient.updatePaymentStatus(businessId, id, status);
      if (res.success) {
        setActionSuccess('تم إقرار واستيفاء العملية المالية بنجاح');
        fetchFulfillmentData();
      }
    } catch (_err) {
      setError('فشل تحديث حالة السداد المالي');
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-600" />
            <span>منظومة الوفاء والتسليم والحدود المالية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة أنماط الوفاء والتوصيل الميداني، إثبات الاكتمال (OTP)، وتتبع حالات السداد النقدي والمحافظ المالية.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchFulfillmentData} className="rounded-xl gap-1.5 text-xs font-bold shrink-0">
          <RefreshCw className="w-4 h-4" />
          <span>تحديث</span>
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex justify-between items-center">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-bold flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('fulfillments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'fulfillments'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>إجراءات الوفاء والتسليم ({fulfillments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'payments'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>سجلات السداد والحدود المالية ({payments.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* FULFILLMENTS TAB */}
          {activeTab === 'fulfillments' && (
            <div className="space-y-4">
              {fulfillments.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد عمليات وفاء أو تسليم مسجلة حالياً.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {fulfillments.map((ful) => (
                    <Card key={ful.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              إجراء وفاء #{ful.id.substring(0, 8)}
                            </h3>
                            <Badge variant={ful.status === 'FULFILLED' ? 'emerald' : 'gold'} className="text-[11px]">
                              {ful.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            نمط الوفاء: <span className="font-bold text-slate-700 dark:text-slate-300">{ful.mode}</span>
                          </p>
                        </div>

                        {ful.otpCode && ful.status !== 'FULFILLED' && (
                          <div className="bg-amber-50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 text-center shrink-0">
                            <span className="text-[10px] text-amber-600 block">رمز إثبات الاستلام (OTP):</span>
                            <span className="text-xs font-mono font-black text-amber-800 dark:text-amber-200 tracking-wider">
                              {ful.otpCode}
                            </span>
                          </div>
                        )}
                      </div>

                      {ful.notes && (
                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                          {ful.notes}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        {ful.status === 'PENDING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(ful.id, 'PREPARING')}
                            className="rounded-xl text-xs font-bold"
                          >
                            بدء التجهيز
                          </Button>
                        )}

                        {ful.status === 'PREPARING' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(ful.id, 'IN_TRANSIT')}
                            className="rounded-xl text-xs font-bold"
                          >
                            بدء الشحن والتوصيل
                          </Button>
                        )}

                        {ful.status !== 'FULFILLED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setOtpFulfillmentItem(ful);
                              setInputOtp('');
                            }}
                            className="rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>تأكيد رمز إثبات الاستلام</span>
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">سجلات إقرار المدفوعات النقدية وتحويلات الصرافين والمحافظ Digital Wallet.</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowCreatePaymentModal(true)}
                  className="rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>تسجيل معاملة سداد</span>
                </Button>
              </div>

              {payments.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد سجلات سداد مالية مسجلة حالياً.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {payments.map((pay) => (
                    <Card key={pay.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {pay.amount} {pay.currency || 'ر.س'}
                          </h3>
                          <p className="text-xs text-slate-500">طريقة السداد: {pay.method}</p>
                        </div>
                        <Badge variant={pay.status === 'PAID' ? 'emerald' : 'gold'} className="text-[11px]">
                          {pay.status}
                        </Badge>
                      </div>

                      {pay.referenceNumber && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl font-mono">
                          رقم الإشعار / المرجع: {pay.referenceNumber}
                        </p>
                      )}

                      {pay.status !== 'PAID' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConfirmPayment(pay.id, 'PAID')}
                          className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white w-full"
                        >
                          إقرار استلام المبلغ النقدي/المحول
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: OTP Proof Verification */}
      {otpFulfillmentItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl dir-rtl">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-teal-600" />
              <span>إدخال رمز إثبات الاستلام (OTP Proof)</span>
            </h3>

            <p className="text-xs text-slate-500">
              قم بإدخال رمز التأكيد الـ 6-أرقام المزود من الزبون لإغلاق حالة الوفاء والتأكد من وصول المنافع.
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <Input
                label="رمز الإثبات (6 أرقام)"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                placeholder="مثال: 492810"
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setOtpFulfillmentItem(null)} className="rounded-xl">
                  إلغاء
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white">
                  فحص وإغلاق
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Payment Record */}
      {showCreatePaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl dir-rtl">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-600" />
              <span>تسجيل معاملة سداد مالية</span>
            </h3>

            <form onSubmit={handleCreatePayment} className="space-y-4">
              <Input
                label="مبلغ المعاملة المالية (ر.س)"
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                placeholder="مثال: 1000"
                required
              />

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">طريقة السداد</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-teal-500"
                >
                  <option value="CASH_ON_DELIVERY">دفع نقدي عند الاستلام (COD)</option>
                  <option value="WALLET_TRANSFER">تحويل عبر محفظة رقمية (جوالي / كاش)</option>
                  <option value="BANK_TRANSFER">تحويل بنكي / صرافة محلية</option>
                </select>
              </div>

              <Input
                label="رقم الإشعار / مرجع التحويل (اختياري)"
                value={payRefNo}
                onChange={(e) => setPayRefNo(e.target.value)}
                placeholder="رقم العملية أو الإشعار..."
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setShowCreatePaymentModal(false)} className="rounded-xl">
                  إلغاء
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white">
                  حفظ المعاملة
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
