'use client';

import React, { useState } from 'react';
import { Button, Input } from '@waynah/ui';
import { apiClient } from '../../lib/api/api-client';

export interface CorrectionModalProps {
  placeId: string;
  placeName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CorrectionModal: React.FC<CorrectionModalProps> = ({
  placeId,
  placeName,
  isOpen,
  onClose,
}) => {
  const [reportType, setReportType] = useState<string>('INCORRECT_PHONE');
  const [suggestedValue, setSuggestedValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [observationId, setObservationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const val = suggestedValue.trim();
    if (!val) {
      setError('يرجى كتابة المعلومة الصحيحة المقترحة قبل الإرسال.');
      setIsSubmitting(false);
      return;
    }

    // Validate UUID format for placeId
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(placeId);
    const enableMock = process.env.NEXT_PUBLIC_ENABLE_MOCK_FALLBACK === 'true';
    const validPlaceId = isValidUuid ? placeId : (enableMock ? '00000000-0000-0000-0000-000000000002' : undefined);

    const payload: {
      placeId?: string;
      phone?: string;
      name?: string;
      latitude?: number;
      longitude?: number;
    } = {
      placeId: validPlaceId,
    };

    if (reportType === 'INCORRECT_PHONE') {
      payload.phone = val;
    } else if (reportType === 'CORRECT_NAME') {
      payload.name = val;
    } else if (reportType === 'RELOCATION') {
      const parts = val.split(',').map((s) => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]!) && !isNaN(parts[1]!)) {
        payload.latitude = parts[0];
        payload.longitude = parts[1];
      } else {
        setError('يرجى إدخال إحداثيات صالحة بصيغة: خط العرض، خط الطول (مثال: 15.9189, 43.2081)');
        setIsSubmitting(false);
        return;
      }
    }

    const res = await apiClient.submitPlaceCorrection(payload);
    setIsSubmitting(false);

    if (res.success && res.data) {
      setObservationId(res.data.observation.id);
      setIsSubmitted(true);
    } else {
      const errorMsg =
        typeof res.error === 'string'
          ? res.error
          : res.error?.message || 'تعذر تسليم البلاغ المكاني، يرجى المحاولة لاحقاً.';
      setError(errorMsg);
    }
  };

  const resetAndClose = () => {
    setIsSubmitted(false);
    setIsSubmitting(false);
    setObservationId(null);
    setError(null);
    setSuggestedValue('');
    onClose();
  };

  const getPlaceholder = () => {
    switch (reportType) {
      case 'INCORRECT_PHONE':
        return 'أدخل رقم الهاتف الجديد (مثال: +967 771 234 567)...';
      case 'CORRECT_NAME':
        return 'أدخل الاسم الصحيح الدقيق للمكان...';
      case 'RELOCATION':
        return 'أدخل الإحداثيات بصيغة: خط العرض، خط الطول (مثال: 15.9189, 43.2081)...';
      default:
        return 'أدخل المعلومة البنيوية الصحيحة المقترحة...';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-5 text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              المساهمة في تحديث أو تصحيح المكان
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              المكان: <span className="font-bold text-slate-700 dark:text-slate-300">{placeName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {isSubmitted ? (
          /* Success Receipt State */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400 flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <div className="space-y-2">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                تم تسليم البلاغ وتسجيله في سجل الرصد المكاني
              </h4>
              {observationId && (
                <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  رقم الرصد: <span className="font-bold text-primary-600 dark:text-primary-400">{observationId}</span>
                </div>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
                تم تسجيل البلاغ للمراجعة والتثبت المكاني. تنبيه: الرصد القائم على الأدلة لا يغير بيانات المكان تلقائياً لحين اكتمال التحقق الميداني.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="primary" size="sm" onClick={resetAndClose} className="font-bold">
                إغلاق النافذة
              </Button>
            </div>
          </div>
        ) : (
          /* Form Input Flow */
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Category Select */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                نوع التصحيح المكاني البنيوي:
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
              >
                <option value="INCORRECT_PHONE">تغيير أو إضافة رقم الهاتف (الهاتف)</option>
                <option value="CORRECT_NAME">تصحيح اسم المكان الرسمي (الاسم)</option>
                <option value="RELOCATION">تحديث الإحداثيات الجغرافية (الموقع)</option>
              </select>
            </div>

            {/* Suggested Value input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                المعلومة الصحيحة المقترحة:
              </label>
              <Input
                type="text"
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                placeholder={getPlaceholder()}
                className="text-xs"
              />
            </div>

            {/* Scope info alert */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
              ℹ️ تنبيه: يتم تسجيل التصحيح في سجل الرصد المكاني بصفة مستقلة. تحديثات ساعات العمل والإغلاق غير البنيوي غير متوفرة في هذا النطاق لحين تفعيل سجل الأدلة في المراحل القادمة.
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/80">
              <Button type="button" variant="outline" size="sm" onClick={resetAndClose} disabled={isSubmitting}>
                إلغاء
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="font-bold">
                إرسال للمراجعة
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

