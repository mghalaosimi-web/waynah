'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiClient, type CatalogProduct, type CatalogServiceItem } from '../../lib/api/api-client';
import { Button } from '@waynah/ui';
import {
  Package,
  Wrench,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Tag,
  DollarSign,
  Layers,
  FileText
} from 'lucide-react';

interface CatalogSectionProps {
  businessId: string;
  currentMembershipRole: 'OWNER' | 'MANAGER' | 'MEMBER';
  actor: any;
}

export function CatalogSection({ businessId, currentMembershipRole, actor }: CatalogSectionProps) {
  const isManagerOrOwner =
    actor?.type === 'ADMIN' || currentMembershipRole === 'OWNER' || currentMembershipRole === 'MANAGER';

  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [services, setServices] = useState<CatalogServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State for Adding Product
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [prodNameAr, setProdNameAr] = useState('');
  const [prodDescription, setProdDescription] = useState('');
  const [prodPrice, setProdPrice] = useState<number | ''>(0);
  const [prodSku, setProdSku] = useState('');
  const [prodIsAvailable, setProdIsAvailable] = useState(true);
  const [isSubmittingProd, setIsSubmittingProd] = useState(false);
  const [prodFormError, setProdFormError] = useState<string | null>(null);

  // Form State for Adding Service
  const [showAddServiceModal, setShowAddServiceModal] = useState<boolean>(false);
  const [srvNameAr, setSrvNameAr] = useState('');
  const [srvDescription, setSrvDescription] = useState('');
  const [srvPrice, setSrvPrice] = useState<number | ''>('');
  const [srvDuration, setSrvDuration] = useState<number | ''>('');
  const [srvIsAvailable, setSrvIsAvailable] = useState(true);
  const [isSubmittingSrv, setIsSubmittingSrv] = useState(false);
  const [srvFormError, setSrvFormError] = useState<string | null>(null);

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.getMerchantCatalog(businessId);
      if (res.success && res.data) {
        setProducts(res.data.products || []);
        setServices(res.data.services || []);
      } else {
        const msg = typeof res.error === 'string' ? res.error : res.error?.message || 'فشل جلب الكتالوج';
        setError(msg);
      }
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchCatalog();
  }, [fetchCatalog]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setProdFormError(null);

    if (!prodNameAr || prodNameAr.trim().length < 2) {
      setProdFormError('اسم المنتج يجب أن يكون حرفين على الأقل');
      return;
    }

    if (prodPrice === '' || Number(prodPrice) < 0) {
      setProdFormError('يرجى تحديد سعر صحصح للمنتج');
      return;
    }

    setIsSubmittingProd(true);
    try {
      const res = await apiClient.createProduct(businessId, {
        nameAr: prodNameAr.trim(),
        description: prodDescription.trim() || undefined,
        price: Number(prodPrice),
        sku: prodSku.trim() || undefined,
        isAvailable: prodIsAvailable,
      });

      if (res.success) {
        setSuccessMsg('تم إضافة المنتج بنجاح إلى الكتالوج');
        setShowAddProductModal(false);
        setProdNameAr('');
        setProdDescription('');
        setProdPrice(0);
        setProdSku('');
        setProdIsAvailable(true);
        await fetchCatalog();
      } else {
        const msg = typeof res.error === 'string' ? res.error : res.error?.message || 'فشل إضافة المنتج';
        setProdFormError(msg);
      }
    } catch {
      setProdFormError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsSubmittingProd(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSrvFormError(null);

    if (!srvNameAr || srvNameAr.trim().length < 2) {
      setSrvFormError('اسم الخدمة يجب أن يكون حرفين على الأقل');
      return;
    }

    setIsSubmittingSrv(true);
    try {
      const res = await apiClient.createService(businessId, {
        nameAr: srvNameAr.trim(),
        description: srvDescription.trim() || undefined,
        price: srvPrice === '' ? null : Number(srvPrice),
        durationMinutes: srvDuration === '' ? null : Number(srvDuration),
        isAvailable: srvIsAvailable,
      });

      if (res.success) {
        setSuccessMsg('تم إضافة الخدمة بنجاح إلى الكتالوج');
        setShowAddServiceModal(false);
        setSrvNameAr('');
        setSrvDescription('');
        setSrvPrice('');
        setSrvDuration('');
        setSrvIsAvailable(true);
        await fetchCatalog();
      } else {
        const msg = typeof res.error === 'string' ? res.error : res.error?.message || 'فشل إضافة الخدمة';
        setSrvFormError(msg);
      }
    } catch {
      setSrvFormError('حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsSubmittingSrv(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذا المنتج من الكتالوج؟')) return;
    try {
      const res = await apiClient.deleteProduct(businessId, productId);
      if (res.success) {
        setSuccessMsg('تم حذف المنتج بنجاح');
        await fetchCatalog();
      } else {
        setError(typeof res.error === 'string' ? res.error : res.error?.message || 'فشل حذف المنتج');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('هل أنت تأكد من رغبتك في حذف هذه الخدمة من الكتالوج؟')) return;
    try {
      const res = await apiClient.deleteService(businessId, serviceId);
      if (res.success) {
        setSuccessMsg('تم حذف الخدمة بنجاح');
        await fetchCatalog();
      } else {
        setError(typeof res.error === 'string' ? res.error : res.error?.message || 'فشل حذف الخدمة');
      }
    } catch {
      setError('حدث خطأ أثناء الاتصال بالخادم');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              كتالوج المنتجات والخدمات (Phase 5)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              كتالوج العرض الرسمي للنشاط التجاري والوفرة التشغيلية
            </p>
          </div>
        </div>

        {/* Action Button */}
        {isManagerOrOwner && (
          <div className="flex items-center gap-2">
            {activeTab === 'products' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddProductModal(true)}
                className="gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة منتج مادي</span>
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddServiceModal(true)}
                className="gap-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة خدمة</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'products'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>المنتجات المادية ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'services'
              ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>الخدمات والأعمال ({services.length})</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-36 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      ) : activeTab === 'products' ? (
        /* Products List */
        products.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
            <Package className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">لا يوجد منتجات مادية مضافة بعد</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              قم بإضافة المنتجات المادية المتاحة لدى نشاطك التجاري لعرضها في الدليل.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                      {p.nameAr}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        p.isAvailable
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {p.isAvailable ? 'متوفر' : 'غير متوفر'}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{p.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 font-black text-sm text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span>{p.price.toLocaleString('ar-SA')} YER</span>
                  </div>

                  {isManagerOrOwner && (
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Services List */
        services.length === 0 ? (
          <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-3">
            <Wrench className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">لا يوجد خدمات مضافة بعد</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              أضف الخدمات والأعمال التي يقدمها نشاطك لتوضيح مواصفاتها ومددها وسعرها للعملاء.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                      {s.nameAr}
                    </h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        s.isAvailable
                          ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-500/20'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {s.isAvailable ? 'متاحة' : 'غير متاحة'}
                    </span>
                  </div>

                  {s.description && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{s.description}</p>
                  )}

                  {s.durationMinutes && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>المدة التقديرية: {s.durationMinutes} دقيقة</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <div className="font-black text-xs text-blue-600 dark:text-blue-400">
                    {s.price !== null && s.price !== undefined ? (
                      <span>{s.price.toLocaleString('ar-SA')} YER</span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md border border-amber-500/20">
                        حسب الطلب / RFQ
                      </span>
                    )}
                  </div>

                  {isManagerOrOwner && (
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="حذف الخدمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>إضافة منتج مادي جديد</span>
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {prodFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {prodFormError}
              </div>
            )}

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم المنتج المادي <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={prodNameAr}
                  onChange={(e) => setProdNameAr(e.target.value)}
                  placeholder="مثال: بطارية تويوتا 60 أمبير"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  السعر (بالريال اليمني YER) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="45000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف والمواصفات (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="مواصفات المنتج وحجمه..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prodAvailable"
                  checked={prodIsAvailable}
                  onChange={(e) => setProdIsAvailable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="prodAvailable" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  المنتج متوفر حالياً للعرض والطلب
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddProductModal(false)}
                  className="rounded-xl text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingProd}
                  className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmittingProd ? 'جاري الإضافة...' : 'حفظ المنتج'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Service Modal */}
      {showAddServiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <span>إضافة خدمة جديدة</span>
              </h3>
              <button
                onClick={() => setShowAddServiceModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {srvFormError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {srvFormError}
              </div>
            )}

            <form onSubmit={handleAddService} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الخدمة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={srvNameAr}
                  onChange={(e) => setSrvNameAr(e.target.value)}
                  placeholder="مثال: فحص كمبيوتر وتحديد الأعطال"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  السعر (اتركه فارغاً إذا كان حسب الطلب / RFQ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={srvPrice}
                  onChange={(e) => setSrvPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="اتركه فارغاً لطلب عرض سعر RFQ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف ونطاق الخدمة (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={srvDescription}
                  onChange={(e) => setSrvDescription(e.target.value)}
                  placeholder="تفاصيل ما تشمله الخدمة..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="srvAvailable"
                  checked={srvIsAvailable}
                  onChange={(e) => setSrvIsAvailable(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="srvAvailable" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  الخدمة متاحة حالياً للطلب
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddServiceModal(false)}
                  className="rounded-xl text-xs"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingSrv}
                  className="rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSubmittingSrv ? 'جاري الإضافة...' : 'حفظ الخدمة'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
