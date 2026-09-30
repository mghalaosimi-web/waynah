import { apiClient } from '../../../../../lib/api-client.js';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PlaceKnowledgeHistoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const placeId = resolvedParams.id;

  const place = await apiClient.getPlaceHistory(placeId);

  if (!place) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">المكان غير موجود</h2>
        <p className="text-sm text-slate-500 mt-2">
          لم يتم العثور على المكان صاحب المعرف "{placeId}".
        </p>
        <a
          href="/admin/conflicts"
          className="inline-block mt-4 text-sm font-medium text-emerald-600 hover:underline"
        >
          العودة لطابور التعارضات &rarr;
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{place.nameAr}</h1>
            {place.nameEn && (
              <span className="text-sm text-slate-500 font-mono">({place.nameEn})</span>
            )}
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-medium">
              {place.category.nameAr}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600">
            <span>المديرية: {place.district.nameAr} ({place.district.governorate.nameAr})</span>
            {place.phoneNumber && <span>الهاتف: {place.phoneNumber}</span>}
            {place.location && (
              <span>الإحداثيات: {place.location.latitude.toFixed(5)}, {place.location.longitude.toFixed(5)}</span>
            )}
            <span>الحالة: {place.verificationStatus}</span>
          </div>
        </div>

        <a
          href="/admin/conflicts"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-300 rounded-md px-3 py-2 bg-slate-50 hover:bg-slate-100 text-center transition-colors"
        >
          العودة للتعارضات &rarr;
        </a>
      </div>

      {/* Observation History Timeline / Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800">
            سجل الملاحظات والمصادر (Knowledge Observations History)
          </h2>
          <span className="text-xs text-slate-500">
            إجمالي الملاحظات: {place.observations.length}
          </span>
        </div>

        {place.observations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            لا توجد ملاحظات مسجلة لهذا المكان.
          </div>
        ) : (
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-100/70 text-slate-700 border-b border-slate-200 text-xs font-semibold">
              <tr>
                <th className="p-3">الملاحظة (ID)</th>
                <th className="p-3">مصدر البيانات</th>
                <th className="p-3">اسم المكان المستخرج</th>
                <th className="p-3">الهاتف المستخرج</th>
                <th className="p-3">درجة الثقة (Confidence)</th>
                <th className="p-3">الحالة</th>
                <th className="p-3">تاريخ الاكتشاف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {place.observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono text-xs text-slate-600">{obs.id.slice(0, 8)}...</td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800">{obs.dataSource.name}</span>
                    <span className="block text-[11px] text-slate-500 font-mono">
                      وزن الثقة: {obs.dataSource.reliabilityWeight}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-900">{obs.name || '—'}</td>
                  <td className="p-3 font-mono text-xs text-slate-700">{obs.phone || '—'}</td>
                  <td className="p-3">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 font-mono">
                      {(obs.confidenceScore * 100).toFixed(0)}% ({obs.confidenceScore.toFixed(2)})
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        obs.status === 'AUTO_APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : obs.status === 'CONFLICTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {obs.status}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-slate-500">
                    {new Date(obs.discoveredAt).toLocaleString('ar-YE')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
