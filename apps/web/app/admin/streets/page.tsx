import Link from 'next/link';
import { AlertTriangle, Database, MapPinned, Route } from 'lucide-react';
import { Container, PageHeader } from '@waynah/ui';

const blockers = [
  {
    title: 'نموذج بيانات الطرق',
    description: 'لا يوجد حالياً كيان Street أو Road مستقل في مخطط قاعدة البيانات.',
    icon: Database,
  },
  {
    title: 'مصدر جغرافي موثوق',
    description: 'لم يُعتمد بعد مصدر بيانات طرق مع توثيق المصدر والترخيص وتاريخ الاستيراد.',
    icon: MapPinned,
  },
  {
    title: 'التوجيه والمسارات',
    description: 'لا يمكن إظهار مسارات أو أزمنة وصول موثوقة قبل اختبار تغطية شبكة الطرق في اليمن.',
    icon: Route,
  },
];

export default function AdminStreetsPage() {
  return (
    <Container size="xl" className="space-y-6 py-8">
      <PageHeader
        title="شبكة الشوارع والطرق"
        subtitle="حالة جاهزية بيانات الطرق الجغرافية قبل تفعيل إدارتها داخل WAYNAH."
      />

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950/20">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-100">إدارة شبكة الطرق غير مفعّلة بعد</p>
            <p className="mt-1 text-sm leading-7 text-amber-800 dark:text-amber-200">
              لن نعرض شوارع أو خطوط طرق تجريبية على أنها بيانات حقيقية. يجب أولاً اعتماد مصدر جغرافي،
              وبناء نموذج PostGIS للطرق، والتحقق من التغطية والدقة في محافظة حجة قبل فتح أدوات الإدارة.
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="متطلبات تفعيل شبكة الطرق">
        {blockers.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <span className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 font-bold text-slate-900 dark:text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p>
              <span className="mt-4 inline-flex rounded-full border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:text-amber-200">
                بانتظار الاعتماد
              </span>
            </article>
          );
        })}
      </section>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
        <p className="font-semibold text-slate-900 dark:text-white">مسار التنفيذ المسجل</p>
        <p className="mt-2 leading-7">
          مقارنة MapLibre وPhoton وValhalla واختبار تغطية بيانات الطرق لمحافظة حجة، مع إبقاء Leaflet
          ومسار عرض الأماكن الحاليين دون تغيير حتى اجتياز الاختبارات.
        </p>
        <Link
          href="https://github.com/mghalaosimi-web/waynah/issues/16"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex font-semibold text-teal-700 underline underline-offset-4 dark:text-teal-300"
        >
          متابعة دراسة التكامل الجغرافي
        </Link>
      </div>
    </Container>
  );
}
