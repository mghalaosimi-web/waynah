'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Input,
  Skeleton,
} from '@waynah/ui';
import {
  MessageSquare,
  FileText,
  DollarSign,
  Calendar,
  ShoppingBag,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react';
import {
  apiClient,
  type InquiryItem,
  type ServiceRequestItem,
  type RFQItem,
  type BookingItem,
  type TransactionOrderItem,
} from '../../lib/api/api-client';

interface TransactionSectionProps {
  businessId: string;
}

export function TransactionSection({ businessId }: TransactionSectionProps) {
  const [activeTab, setActiveTab] = useState<'inquiries' | 'requests' | 'rfqs' | 'bookings' | 'orders'>('inquiries');

  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [requests, setRequests] = useState<ServiceRequestItem[]>([]);
  const [rfqs, setRfqs] = useState<RFQItem[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [orders, setOrders] = useState<TransactionOrderItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [replyInquiryItem, setReplyInquiryItem] = useState<InquiryItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [quoteRfqItem, setQuoteRfqItem] = useState<RFQItem | null>(null);
  const [quoteAmount, setQuoteAmount] = useState<number | ''>('');
  const [quoteNotes, setQuoteNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [resInq, resReq, resRfq, resBkg, resOrd] = await Promise.all([
        apiClient.getBusinessInquiries(businessId),
        apiClient.getBusinessRequests(businessId),
        apiClient.getBusinessRFQs(businessId),
        apiClient.getBusinessBookings(businessId),
        apiClient.getBusinessOrders(businessId),
      ]);

      if (resInq.success && resInq.data) setInquiries(resInq.data);
      if (resReq.success && resReq.data) setRequests(resReq.data);
      if (resRfq.success && resRfq.data) setRfqs(resRfq.data);
      if (resBkg.success && resBkg.data) setBookings(resBkg.data);
      if (resOrd.success && resOrd.data) setOrders(resOrd.data);
    } catch (_err) {
      setError('تعذر تحميل بيانات التعهدات والطلبات، يرجى المحاولة لاحقاً.');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleReplyInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInquiryItem || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.replyInquiry(businessId, replyInquiryItem.id, replyText);
      if (res.success) {
        setActionSuccess('تم إرسال الرد بنجاح');
        setReplyInquiryItem(null);
        setReplyText('');
        fetchTransactions();
      } else {
        setError(res.error?.message || 'فشل إرسال الرد');
      }
    } catch (_err) {
      setError('حدث خطأ أثناء إرسال الرد');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteRfqItem || typeof quoteAmount !== 'number' || quoteAmount <= 0) return;

    setIsSubmitting(true);
    try {
      const res = await apiClient.createQuote(businessId, quoteRfqItem.id, {
        amount: quoteAmount,
        notes: quoteNotes,
      });
      if (res.success) {
        setActionSuccess('تم تقديم عرض السعر بنجاح');
        setQuoteRfqItem(null);
        setQuoteAmount('');
        setQuoteNotes('');
        fetchTransactions();
      } else {
        setError(res.error?.message || 'فشل تقديم عرض السعر');
      }
    } catch (_err) {
      setError('حدث خطأ أثناء تقديم العرض');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED') => {
    try {
      const res = await apiClient.updateBookingStatus(businessId, bookingId, status);
      if (res.success) {
        setActionSuccess('تم تحديث حالة الحجز بنجاح');
        fetchTransactions();
      }
    } catch (_err) {
      setError('فشل في تحديث حالة الحجز');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: 'PROCESSING' | 'COMPLETED' | 'CANCELLED') => {
    try {
      const res = await apiClient.updateOrderStatus(businessId, orderId, status);
      if (res.success) {
        setActionSuccess('تم تحديث حالة الطلب المالي بنجاح');
        fetchTransactions();
      }
    } catch (_err) {
      setError('فشل في تحديث حالة الطلب المالي');
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      {/* Top Controls & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-emerald-600" />
            <span>إدارة التعهدات والطلبات التجارية</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            إدارة الاستفسارات، والطلبات المباشرة، وعروض الأسعار (RFQ)، والحجوزات، والطلبات المالية التابعة للنشاط التجارية.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchTransactions} className="rounded-xl gap-1.5 text-xs font-bold shrink-0">
          <RefreshCw className="w-4 h-4" />
          <span>تحديث البيانات</span>
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

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'inquiries'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>الاستفسارات ({inquiries.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'requests'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>الطلبات المباشرة ({requests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rfqs')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'rfqs'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>طلبات التسعير RFQ ({rfqs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'bookings'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>الحجوزات ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'orders'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>الطلبات المالية ({orders.length})</span>
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-36 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* 1. INQUIRIES TAB */}
          {activeTab === 'inquiries' && (
            <div className="space-y-4">
              {inquiries.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد استفسارات مقدمة لهذا النشاط التجاري حالياً.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {inquiries.map((inq) => (
                    <Card key={inq.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{inq.subject}</h3>
                          <p className="text-xs text-slate-500">من العميل: {inq.user?.name || 'مجهول'}</p>
                        </div>
                        <Badge variant={inq.status === 'ANSWERED' ? 'emerald' : 'gold'} className="text-[11px]">
                          {inq.status === 'ANSWERED' ? 'تم الرد' : 'قيد الانتظار'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        {inq.message}
                      </p>

                      {inq.reply ? (
                        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 space-y-1">
                          <span className="text-[11px] font-bold text-emerald-600">رد المنشأة:</span>
                          <p className="text-xs text-slate-800 dark:text-slate-200">{inq.reply}</p>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setReplyInquiryItem(inq);
                            setReplyText('');
                          }}
                          className="rounded-xl text-xs font-bold gap-1 text-emerald-600"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>إرسال رد</span>
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. REQUESTS TAB */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد طلبات خدمة مباشرة حالياً.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {requests.map((req) => (
                    <Card key={req.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{req.title}</h3>
                          <p className="text-xs text-slate-500">العميل: {req.user?.name || 'مجهول'}</p>
                        </div>
                        <Badge variant="emerald" className="text-[11px]">{req.status}</Badge>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        {req.description}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. RFQS TAB */}
          {activeTab === 'rfqs' && (
            <div className="space-y-4">
              {rfqs.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد طلبات تسعير (RFQ) تابعة لهذا النشاط.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {rfqs.map((rfq) => (
                    <Card key={rfq.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{rfq.title}</h3>
                          {rfq.budget && (
                            <p className="text-xs font-bold text-emerald-600">
                              الميزانية المحددة: {rfq.budget} {rfq.currency || 'ر.س'}
                            </p>
                          )}
                        </div>
                        <Badge variant="emerald" className="text-[11px]">{rfq.status}</Badge>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        {rfq.description}
                      </p>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuoteRfqItem(rfq);
                          setQuoteAmount('');
                          setQuoteNotes('');
                        }}
                        className="rounded-xl text-xs font-bold gap-1 text-emerald-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>تقديم عرض سعر</span>
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {bookings.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد حجوزات مسجلة.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bookings.map((bkg) => (
                    <Card key={bkg.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            حجز موعد: {new Date(bkg.scheduledAt).toLocaleString('ar-SA')}
                          </h3>
                          <p className="text-xs text-slate-500">العميل: {bkg.user?.name || 'مجهول'}</p>
                        </div>
                        <Badge variant={bkg.status === 'CONFIRMED' ? 'emerald' : 'gold'} className="text-[11px]">
                          {bkg.status}
                        </Badge>
                      </div>

                      {bkg.status === 'PENDING' && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(bkg.id, 'CONFIRMED')}
                            className="rounded-xl text-xs font-bold"
                          >
                            تأكيد الحجز
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateBookingStatus(bkg.id, 'CANCELLED')}
                            className="rounded-xl text-xs font-bold text-rose-600"
                          >
                            إلغاء
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. ORDERS TAB (SINGLE-MERCHANT ENFORCED) */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <Card className="p-8 text-center bg-white dark:bg-slate-850 rounded-2xl">
                  <p className="text-xs text-slate-500">لا توجد طلبات مالية ملزمة حالياً.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {orders.map((ord) => (
                    <Card key={ord.id} className="p-5 bg-white dark:bg-slate-850 rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{ord.orderNumber}</h3>
                            <Badge variant="emerald" className="text-[11px]">{ord.status}</Badge>
                          </div>
                          <p className="text-xs text-slate-500">العميل: {ord.user?.name || 'مجهول'}</p>
                        </div>
                        <span className="text-sm font-extrabold text-emerald-600">
                          {ord.totalAmount} {ord.currency || 'ر.س'}
                        </span>
                      </div>

                      <div className="space-y-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300">عناصر الطلب ({ord.items.length}):</span>
                        {ord.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-slate-600 dark:text-slate-400 text-[11px]">
                            <span>{it.title} × {it.quantity}</span>
                            <span>{it.totalPrice} ر.س</span>
                          </div>
                        ))}
                      </div>

                      {ord.status === 'PENDING' && (
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'PROCESSING')}
                            className="rounded-xl text-xs font-bold"
                          >
                            بدء المعالجة
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(ord.id, 'CANCELLED')}
                            className="rounded-xl text-xs font-bold text-rose-600"
                          >
                            إلغاء الطلب
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Reply Inquiry */}
      {replyInquiryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">الرد على استفسار العميل</h3>
            <form onSubmit={handleReplyInquiry} className="space-y-4 dir-rtl">
              <div className="space-y-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">{replyInquiryItem.subject}</span>
                <p className="text-slate-500">{replyInquiryItem.message}</p>
              </div>

              <Input
                label="نص الرد الرسمي"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب رد المنشأة التجاري..."
                required
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setReplyInquiryItem(null)} className="rounded-xl">
                  إلغاء
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="rounded-xl font-bold">
                  إرسال الرد
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Quote */}
      {quoteRfqItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">تقديم عرض سعر (Quote)</h3>
            <form onSubmit={handleCreateQuote} className="space-y-4 dir-rtl">
              <div className="space-y-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">{quoteRfqItem.title}</span>
                <p className="text-slate-500">{quoteRfqItem.description}</p>
              </div>

              <Input
                label="مبلغ عرض السعر (ر.س)"
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(Number(e.target.value))}
                placeholder="مثال: 1500"
                required
              />

              <Input
                label="ملاحظات العرض والخصومات"
                value={quoteNotes}
                onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="ملاحظات إضافية..."
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setQuoteRfqItem(null)} className="rounded-xl">
                  إلغاء
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting} className="rounded-xl font-bold">
                  إرسال عرض السعر
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
