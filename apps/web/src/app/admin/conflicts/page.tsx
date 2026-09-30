import { apiClient } from '../../../lib/api-client.js';

export const revalidate = 0;

export default async function ConflictsQueuePage() {
  const openConflicts = (await apiClient.getOpenConflicts()) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">طابور تعارضات البيانات (Conflicts Queue)</h1>
          <p className="text-sm text-slate-600 mt-1">
            مراجعة وحل تعارضات الملاحظات غير المتطابقة مع سجلات الأماكن المعتمدة
          </p>
        </div>
        <div className="bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-full border border-amber-200">
          النزاعات المفتوحة: {openConflicts.length}
        </div>
      </div>

      {openConflicts.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          لا توجد تعارضات مفتوحة حالياً في النظام.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4">معرف النزاع (ID)</th>
                <th className="p-4">المكان المرتبط</th>
                <th className="p-4">تفاصيل التعارض (Description)</th>
                <th className="p-4">الملاحظة المرجعية</th>
                <th className="p-4">الملاحظة المتعارضة</th>
                <th className="p-4">تاريخ الإنشاء</th>
                <th className="p-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {openConflicts.map((conflict) => (
                <tr key={conflict.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-600">{conflict.id.slice(0, 8)}...</td>
                  <td className="p-4 font-medium text-slate-900">
                    {conflict.place.nameAr}
                    {conflict.place.nameEn ? ` (${conflict.place.nameEn})` : ''}
                  </td>
                  <td className="p-4 font-mono text-xs text-rose-600 max-w-md break-all">
                    {conflict.description}
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {conflict.baseObservationId.slice(0, 8)}...
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">
                    {conflict.conflictingObservationId.slice(0, 8)}...
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {new Date(conflict.createdAt).toLocaleDateString('ar-YE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="p-4">
                    <a
                      href={`/admin/places/${conflict.placeId}/history`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                    >
                      تاريخ المكان &larr;
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
