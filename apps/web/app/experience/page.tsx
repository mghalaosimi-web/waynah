'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient, type PlaceCategory, type PlaceSearchResult } from '../../lib/api/api-client';
import {
  ArrowLeft, Bell, Bookmark, Building2, CalendarDays, Check,
  ChevronDown, Compass, Heart, Home, MapPin,
  Search, ShoppingBag, SlidersHorizontal, Sparkles, Store, Truck, UserRound, Map as MapIcon,
  X,
} from 'lucide-react';

type Tab = 'home' | 'explore' | 'services' | 'saved' | 'account';
type Listing = {
  id: string;
  name: string;
  category: string;
  district: string;
  description: string;
  status: string;
  kind: 'place' | 'business' | 'destination';
};

const listings: Listing[] = [
  { id: 'demo-01', name: 'مكان محلي — مثال توضيحي', category: 'خدمات عامة', district: 'حجة · بيانات تجريبية', description: 'سجل تجريبي لاختبار عرض المكان وسياقه الجغرافي وحالة التوثيق.', status: 'غير موثق بعد', kind: 'place' },
  { id: 'demo-02', name: 'نشاط تجاري — مثال توضيحي', category: 'تسوق', district: 'حجة · بيانات تجريبية', description: 'واجهة تجريبية لملف نشاط تجاري وفروعه وخدماته.', status: 'بيانات تجريبية', kind: 'business' },
  { id: 'demo-03', name: 'وجهة محلية — مثال توضيحي', category: 'سياحة', district: 'حجة · بيانات تجريبية', description: 'عنصر توضيحي لاستعراض الوجهات والصور والمعلومات السياحية.', status: 'غير موثق بعد', kind: 'destination' },
  { id: 'demo-04', name: 'مرفق صحي — مثال توضيحي', category: 'صحة', district: 'حجة · بيانات تجريبية', description: 'سجل غير حقيقي لاختبار تصنيف الخدمات الصحية والبحث.', status: 'بيانات تجريبية', kind: 'place' },
  { id: 'demo-05', name: 'خدمة تعليمية — مثال توضيحي', category: 'تعليم', district: 'حجة · بيانات تجريبية', description: 'سجل تجريبي يوضح كيفية تنظيم المؤسسات التعليمية.', status: 'بيانات تجريبية', kind: 'place' },
];

const modules = [
  { id: 'market', title: 'السوق المحلي', subtitle: 'منتجات وسلال وطلبات تجريبية', icon: ShoppingBag, state: 'عرض تفاعلي' },
  { id: 'delivery', title: 'التوصيل والخدمات اللوجستية', subtitle: 'إنشاء طلب وتتبع حالات توضيحية', icon: Truck, state: 'محاكاة' },
  { id: 'booking', title: 'الحجوزات والمواعيد', subtitle: 'اختيار خدمة وموعد وإرسال طلب', icon: CalendarDays, state: 'محاكاة' },
  { id: 'business', title: 'ملف النشاط التجاري', subtitle: 'إدارة الملف والخدمات وطلب التوثيق', icon: Store, state: 'عرض تفاعلي' },
  { id: 'community', title: 'مساهمات المجتمع', subtitle: 'اقتراح مكان أو تصحيح معلومة', icon: Sparkles, state: 'عرض تفاعلي' },
  { id: 'admin', title: 'الإدارة والتحليلات', subtitle: 'مراجعة البلاغات وطلبات التوثيق', icon: Building2, state: 'عرض توضيحي' },
];

const products = [
  { id: 'p1', name: 'منتج محلي تجريبي', price: 1200, unit: 'ريال يمني · قيمة افتراضية' },
  { id: 'p2', name: 'حرفة محلية — مثال', price: 2500, unit: 'ريال يمني · قيمة افتراضية' },
];

export default function ProductExperiencePage() {
  const [tab, setTab] = useState<Tab>('home');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [bookingSent, setBookingSent] = useState(false);
  const [contributionSent, setContributionSent] = useState(false);
  const [liveCategories, setLiveCategories] = useState<PlaceCategory[]>([]);
  const [livePlaces, setLivePlaces] = useState<PlaceSearchResult[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveCategoryId, setLiveCategoryId] = useState<string | undefined>(undefined);
  const [liveQuery, setLiveQuery] = useState('');

  const searchLivePlaces = useCallback(async (nextQuery = liveQuery, categoryId = liveCategoryId) => {
    setLiveLoading(true);
    setLiveError(null);
    const result = await apiClient.searchPlaces({ query: nextQuery.trim() || undefined, categoryId, limit: 12 });
    setLiveLoading(false);
    if (result.success && result.data) setLivePlaces(result.data);
    else setLiveError(typeof result.error === 'string' ? result.error : result.error?.message || 'تعذر تحميل الأماكن من خدمة WAYNAH.');
  }, [liveQuery, liveCategoryId]);

  useEffect(() => {
    let active = true;
    apiClient.getCategories().then((result) => {
      if (active && result.success && result.data) setLiveCategories(result.data);
    }).catch(() => undefined);
    searchLivePlaces('', undefined);
    return () => { active = false; };
  }, []);

  const savedListings = listings.filter((item) => saved.includes(item.id));
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const total = products.reduce((sum, item) => sum + item.price * (cart[item.id] || 0), 0);

  function toggleSaved(id: string) {
    setSaved((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    setNotice(saved.includes(id) ? 'أزيل من المحفوظات' : 'أضيف إلى المحفوظات');
  }

  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] || 0) + 1 }));
    setNotice('أضيف المنتج إلى السلة التجريبية');
  }

  function showModule(id: string) {
    setActiveModule(id);
    setBookingSent(false);
    setContributionSent(false);
  }

  const navItems: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'explore', label: 'استكشف', icon: Compass },
    { id: 'services', label: 'الخدمات', icon: Store },
    { id: 'saved', label: 'المحفوظات', icon: Bookmark },
    { id: 'account', label: 'حسابي', icon: UserRound },
  ];

  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F1EA] text-[#18201D] pb-24">
      <div className="mx-auto min-h-screen max-w-[1440px] bg-[#F4F1EA]">
        <header className="sticky top-0 z-30 border-b border-[#D8D5CC] bg-[#F4F1EA]/95 backdrop-blur-xl">
          <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6">
            <a href="/experience" className="flex items-center gap-3" aria-label="WAYNAH الرئيسية">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#123C32] text-white shadow-sm">
                <MapPin size={23} strokeWidth={2.2} />
              </span>
              <span className="leading-tight">
                <span className="block text-lg font-black tracking-tight">وَيْنَه؟</span>
                <span className="block text-[10px] font-semibold tracking-[.18em] text-[#64716A]">WAYNAH · LOCAL ATLAS</span>
              </span>
            </a>
            <div className="hidden items-center gap-2 rounded-full border border-[#D8D5CC] bg-white/70 px-4 py-2 text-xs font-bold text-[#52615A] sm:flex">
              <MapPin size={14} className="text-[#123C32]" />
              اليمن <ChevronDown size={14} />
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setNotice('لا توجد إشعارات جديدة في الوضع التجريبي')} className="relative rounded-full border border-[#D8D5CC] bg-white p-2.5 text-[#123C32]" aria-label="الإشعارات">
                <Bell size={18} />
              </button>
              <button onClick={() => setTab('account')} className="hidden rounded-full bg-[#123C32] px-4 py-2.5 text-xs font-bold text-white sm:inline-flex">دخول تجريبي</button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-10 px-4 py-6 sm:px-6 sm:py-9">
          {tab === 'home' && (
            <>
              <section className="relative isolate overflow-hidden rounded-[30px] bg-[#123C32] px-6 py-9 text-white sm:px-10 sm:py-12">
                <div className="pointer-events-none absolute inset-0 -z-10 opacity-25" aria-hidden="true">
                  <svg viewBox="0 0 900 360" className="h-full w-full" preserveAspectRatio="xMidYMid slice" fill="none">
                    <g stroke="#D8A83E" strokeWidth="1.1">
                      <path d="M-20 90C120 10 230 170 370 95S630 10 920 100" /><path d="M-30 125C130 45 245 205 390 130S650 45 930 135" /><path d="M-40 160C140 80 260 240 410 165S670 80 940 170" /><path d="M-50 195C150 115 275 275 430 200S690 115 950 205" /><path d="M-60 230C160 150 290 310 450 235S710 150 960 240" />
                    </g>
                    <circle cx="700" cy="95" r="44" stroke="#D8A83E" strokeWidth="1.5" /><circle cx="700" cy="95" r="7" fill="#D8A83E" />
                  </svg>
                </div>
                <div className="max-w-2xl space-y-5">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-[#E7D4B1]"><span className="h-1.5 w-1.5 rounded-full bg-[#D8A83E]" /> أطلس محلي · تجربة استكشاف</span>
                  <h1 className="text-3xl font-black leading-[1.35] sm:text-5xl">وين تريد أن تذهب؟<br /><span className="text-[#D8A83E]">اكتشف اليمن بثقة.</span></h1>
                  <p className="max-w-xl text-sm leading-7 text-white/75 sm:text-base">ابحث عن الأماكن والخدمات، وافهم موقعها وسياقها الجغرافي، وساهم في تحسين المعلومات المحلية.</p>
                  <div className="flex max-w-xl items-center gap-2 rounded-2xl bg-white p-2 shadow-xl shadow-black/10">
                    <Search size={19} className="mr-2 shrink-0 text-[#64716A]" />
                    <input value={query} onChange={(event) => { setQuery(event.target.value); setTab('explore'); }} placeholder="ابحث عن مكان أو خدمة..." className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm text-[#18201D] outline-none placeholder:text-[#94A09A]" />
                    <button onClick={() => setTab('explore')} className="rounded-xl bg-[#123C32] px-5 py-3 text-sm font-bold text-white">بحث</button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-white/75">
                    <span className="rounded-full border border-white/20 px-3 py-1.5">حجة · نطاق الإطلاق</span>
                    <span className="rounded-full border border-white/20 px-3 py-1.5">بحث عربي</span>
                    <span className="rounded-full border border-white/20 px-3 py-1.5">قائمة أولاً · خرائط عند الطلب</span>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-[#9A7740]">DISCOVER BY CATEGORY</p><h2 className="mt-1 text-xl font-black">استكشف حسب التصنيف</h2></div><button onClick={() => setTab('explore')} className="text-xs font-bold text-[#123C32]">كل التصنيفات ←</button></div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                  {liveCategories.slice(0, 8).map((item) => <button key={item.id} onClick={() => { setLiveCategoryId(item.id); setTab('explore'); searchLivePlaces(query, item.id); }} className="group rounded-2xl border border-[#D8D5CC] bg-white p-4 text-right transition hover:-translate-y-0.5 hover:border-[#123C32]/40 hover:shadow-md"><span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#123C32]"><MapPin size={19} /></span><span className="text-xs font-extrabold">{item.nameAr}</span></button>)}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-end justify-between"><div><p className="text-xs font-bold text-[#9A7740]">LIVE DIRECTORY</p><h2 className="mt-1 text-xl font-black">من دليل WAYNAH الفعلي</h2></div><button onClick={() => setTab('explore')} className="text-xs font-bold text-[#123C32]">استكشف الدليل ←</button></div>
                {liveLoading ? <p className="rounded-2xl bg-white p-5 text-sm text-[#64716A]">جارٍ تحميل الأماكن من الخدمة...</p> : livePlaces.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{livePlaces.slice(0, 3).map((place) => <a key={place.id} href={`/places/${place.id}`} className="rounded-2xl border border-[#D8D5CC] bg-white p-4 transition hover:border-[#123C32]/40 hover:shadow-md"><div className="flex items-start justify-between gap-2"><h3 className="font-black">{place.nameAr}</h3><span className="rounded-full bg-[#E6ECE7] px-2 py-1 text-[10px] font-bold text-[#123C32]">{place.verificationStatus || 'حالة غير محددة'}</span></div><p className="mt-2 text-xs text-[#64716A]">{place.categoryNameAr || place.category?.nameAr || 'تصنيف غير محدد'} · {place.districtNameAr || place.district?.nameAr || 'منطقة غير محددة'}</p>{place.address && <p className="mt-2 text-xs leading-5 text-[#64716A]">{place.address}</p>}</a>)}</div> : <p className="rounded-2xl border border-dashed border-[#D8D5CC] bg-white p-5 text-sm text-[#64716A]">{liveError || 'لا توجد سجلات منشورة لعرضها حالياً.'}</p>}
              </section>
              <section className="space-y-4">
                <div><p className="text-xs font-bold text-[#9A7740]">PROTOTYPE DATA</p><h2 className="mt-1 text-lg font-black">عناصر توضيحية لاختبار الواجهة</h2><p className="mt-1 text-xs text-[#64716A]">هذه سجلات تجريبية منفصلة عن الدليل الفعلي ولا تمثل أماكن حقيقية.</p></div>
                <ListingGrid items={listings.slice(0, 3)} saved={saved} onOpen={setActiveListing} onSave={toggleSaved} />
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-[#D8D5CC] bg-white p-6"><span className="text-xs font-bold text-[#9A7740]">FOR LOCAL BUSINESSES</span><h3 className="mt-2 text-xl font-black">اجعل نشاطك معروفاً</h3><p className="mt-2 text-sm leading-7 text-[#64716A]">أنشئ ملفاً لنشاطك، أضف الخدمات والفروع، وتابع طلب التوثيق من مكان واحد.</p><button onClick={() => showModule('business')} className="mt-4 rounded-xl bg-[#123C32] px-4 py-3 text-xs font-bold text-white">استكشف خدمات الأعمال</button></div>
                <div className="rounded-3xl border border-[#D8D5CC] bg-[#EAE4D8] p-6"><span className="text-xs font-bold text-[#9A7740]">COMMUNITY POWERED</span><h3 className="mt-2 text-xl font-black">ساعدنا على تحسين الدليل</h3><p className="mt-2 text-sm leading-7 text-[#64716A]">اقترح مكاناً أو أبلغ عن معلومة تحتاج إلى تحديث. كل مساهمة تمر بمراجعة واضحة.</p><button onClick={() => showModule('community')} className="mt-4 rounded-xl border border-[#123C32]/20 px-4 py-3 text-xs font-bold text-[#123C32]">ساهم في الدليل</button></div>
              </section>
            </>
          )}

          {tab === 'explore' && (
            <section className="space-y-6">
              <div><p className="text-xs font-bold text-[#9A7740]">FIND YOUR PLACE</p><h1 className="mt-1 text-2xl font-black">استكشف الأماكن</h1><p className="mt-2 text-sm text-[#64716A]">نتائج مباشرة من دليل الأماكن عبر واجهة API الخاصة بالمشروع.</p></div>
              <form onSubmit={(event) => { event.preventDefault(); setLiveQuery(query); searchLivePlaces(query, liveCategoryId); }} className="flex items-center gap-2 rounded-2xl border border-[#D8D5CC] bg-white px-4 py-2"><Search size={18} className="text-[#64716A]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setLiveQuery(event.target.value); }} placeholder="ابحث في دليل الأماكن الفعلي" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" /><button type="submit" className="rounded-lg bg-[#123C32] px-4 py-2 text-xs font-bold text-white">بحث</button></form>
              <div className="flex flex-wrap gap-2">{liveCategories.map((item) => <button key={item.id} onClick={() => { const next = liveCategoryId === item.id ? undefined : item.id; setLiveCategoryId(next); searchLivePlaces(query, next); }} className={`rounded-full px-4 py-2 text-xs font-bold transition ${liveCategoryId === item.id ? 'bg-[#123C32] text-white' : 'border border-[#D8D5CC] bg-white text-[#52615A]'}`}>{item.nameAr}</button>)}</div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#EAE4D8] p-3"><p className="text-xs leading-6 text-[#52615A]">النتائج أدناه تأتي من API المشروع. لا نضيف إحداثيات أو أماكن تجريبية إلى الدليل الحقيقي.</p><a href={`/map?q=${encodeURIComponent(query)}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#123C32] px-3 py-2 text-xs font-bold text-white"><MapIcon size={15} /> فتح الخريطة</a></div>
              <div className="flex items-center justify-between text-xs text-[#64716A]"><span>{livePlaces.length} نتيجة من الدليل الفعلي</span><span>{liveLoading ? 'جارٍ التحميل...' : 'طبقة API'}</span></div>
              {liveError && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-xs text-rose-700">{liveError}</p>}
              {livePlaces.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{livePlaces.map((place) => <a key={place.id} href={`/places/${place.id}`} className="rounded-2xl border border-[#D8D5CC] bg-white p-4 transition hover:border-[#123C32]/40 hover:shadow-md"><h3 className="font-black">{place.nameAr}</h3><p className="mt-2 text-xs text-[#64716A]">{place.categoryNameAr || place.category?.nameAr || 'تصنيف غير محدد'} · {place.districtNameAr || place.district?.nameAr || 'منطقة غير محددة'}</p>{place.address && <p className="mt-2 text-xs text-[#64716A]">{place.address}</p>}</a>)}</div> : !liveLoading && <div className="rounded-2xl border border-dashed border-[#C9C3B7] bg-white p-8 text-center text-sm text-[#64716A]">لا توجد نتائج منشورة مطابقة حالياً.</div>}
              <div className="rounded-2xl border border-[#D8D5CC] bg-white p-4 text-xs leading-6 text-[#64716A]">السجلات التجريبية لا تدخل في نتائج البحث ولا تظهر كبيانات حقيقية.</div>
            </section>
          )}

          {tab === 'services' && (
            <section className="space-y-6">
              <div><p className="text-xs font-bold text-[#9A7740]">THE WAYNAH ECOSYSTEM</p><h1 className="mt-1 text-2xl font-black">الخدمات والمنظومة</h1><p className="mt-2 text-sm text-[#64716A]">نماذج تفاعلية مستقبلية؛ لا تمثل تكاملات دفع أو تشغيل خارجية.</p></div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{modules.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => showModule(item.id)} className="rounded-2xl border border-[#D8D5CC] bg-white p-5 text-right transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F4F1EA] text-[#123C32]"><Icon size={21} /></span><span className="rounded-full bg-[#F4F1EA] px-2.5 py-1 text-[10px] font-bold text-[#8B6B37]">{item.state}</span></div><h2 className="mt-4 font-black">{item.title}</h2><p className="mt-1 text-xs leading-6 text-[#64716A]">{item.subtitle}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#123C32]">فتح الوحدة <ArrowLeft size={14} /></span></button>; })}</div>
            </section>
          )}

          {tab === 'saved' && (
            <section className="space-y-5"><div><p className="text-xs font-bold text-[#9A7740]">YOUR COLLECTION</p><h1 className="mt-1 text-2xl font-black">المحفوظات</h1></div>{savedListings.length ? <ListingGrid items={savedListings} saved={saved} onOpen={setActiveListing} onSave={toggleSaved} /> : <div className="rounded-3xl border border-dashed border-[#C9C3B7] bg-white px-6 py-14 text-center"><Bookmark className="mx-auto text-[#9A7740]" size={28} /><h2 className="mt-3 font-black">لم تحفظ أي مكان بعد</h2><p className="mt-2 text-sm text-[#64716A]">احفظ الأماكن التي تهمك لتعود إليها لاحقاً.</p><button onClick={() => setTab('explore')} className="mt-4 rounded-xl bg-[#123C32] px-5 py-3 text-xs font-bold text-white">ابدأ الاستكشاف</button></div>}</section>
          )}

          {tab === 'account' && (
            <section className="mx-auto max-w-2xl space-y-5"><div><p className="text-xs font-bold text-[#9A7740]">YOUR WAYNAH</p><h1 className="mt-1 text-2xl font-black">حساب المستخدم</h1></div><div className="rounded-3xl bg-[#123C32] p-6 text-white"><div className="flex items-center gap-4"><span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><UserRound size={25} /></span><div><h2 className="font-black">مرحباً بك في وَيْنَه؟</h2><p className="mt-1 text-xs text-white/70">وضع استعراض تجريبي · لا يوجد تسجيل دخول حقيقي</p></div></div><button onClick={() => setNotice('سيتم ربط المصادقة الحقيقية في مرحلة التكامل الخلفي')} className="mt-5 rounded-xl bg-[#D8A83E] px-4 py-3 text-xs font-black text-[#18201D]">متابعة بحساب تجريبي</button></div><div className="divide-y divide-[#E5E0D6] rounded-2xl border border-[#D8D5CC] bg-white">{[['المحفوظات', Bookmark], ['طلب إضافة مكان', MapPin], ['طلب تسجيل نشاط تجاري', Store], ['الإشعارات', Bell], ['الإعدادات واللغة', SlidersHorizontal]].map(([label, Icon]) => { const I = Icon as typeof Home; return <button key={label as string} onClick={() => label === 'المحفوظات' ? setTab('saved') : showModule(label === 'طلب إضافة مكان' ? 'community' : 'business')} className="flex w-full items-center justify-between p-4 text-sm font-bold"><span className="flex items-center gap-3"><I size={17} className="text-[#123C32]" />{label as string}</span><ArrowLeft size={15} className="text-[#9AA39E]" /></button>; })}</div></section>
          )}
        </main>

        <nav aria-label="التنقل الرئيسي" className="fixed inset-x-0 bottom-0 z-40 border-t border-[#D8D5CC] bg-[#FBFAF7]/95 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-xl">
          <div className="mx-auto flex max-w-xl items-center justify-around">{navItems.slice(0, 2).map((item) => { const Icon = item.icon; const active = tab === item.id; return <button key={item.id} onClick={() => setTab(item.id)} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition ${active ? 'text-[#123C32]' : 'text-[#89938D]'}`}><span className={`flex h-8 w-9 items-center justify-center rounded-xl ${active ? 'bg-[#E6ECE7]' : ''}`}><Icon size={19} strokeWidth={active ? 2.4 : 1.8} /></span>{item.label}</button>; })}<a href="/map" className="flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold text-[#89938D]"><span className="flex h-8 w-9 items-center justify-center rounded-xl"><MapIcon size={19} /></span>الخريطة</a>{navItems.slice(2).map((item) => { const Icon = item.icon; const active = tab === item.id; return <button key={item.id} onClick={() => setTab(item.id)} aria-current={active ? 'page' : undefined} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-bold transition ${active ? 'text-[#123C32]' : 'text-[#89938D]'}`}><span className={`flex h-8 w-9 items-center justify-center rounded-xl ${active ? 'bg-[#E6ECE7]' : ''}`}><Icon size={19} strokeWidth={active ? 2.4 : 1.8} /></span>{item.label}</button>; })}</div>
        </nav>

        {activeListing && <Modal title={activeListing.name} onClose={() => setActiveListing(null)}><div className="space-y-4"><span className="inline-flex rounded-full bg-[#F4F1EA] px-3 py-1 text-[11px] font-bold text-[#8B6B37]">{activeListing.status}</span><p className="text-sm leading-7 text-[#64716A]">{activeListing.description}</p><div className="rounded-xl bg-[#F4F1EA] p-4 text-xs leading-6"><p><strong>التصنيف:</strong> {activeListing.category}</p><p><strong>النطاق:</strong> {activeListing.district}</p><p><strong>الموقع:</strong> لا توجد إحداثيات موثقة لهذا السجل التجريبي.</p></div><button onClick={() => toggleSaved(activeListing.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123C32] px-4 py-3 text-sm font-bold text-white"><Heart size={16} />{saved.includes(activeListing.id) ? 'إزالة من المحفوظات' : 'حفظ المكان'}</button></div></Modal>}

        {activeModule && <Modal title={modules.find((item) => item.id === activeModule)?.title || 'وحدة WAYNAH'} onClose={() => setActiveModule(null)}><ModuleDemo id={activeModule} cart={cart} total={total} cartCount={cartCount} onAdd={addToCart} bookingSent={bookingSent} onBooking={() => setBookingSent(true)} contributionSent={contributionSent} onContribution={() => setContributionSent(true)} /></Modal>}

        {notice && <div role="status" className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#18201D] px-4 py-3 text-xs font-bold text-white shadow-xl"><Check size={15} className="text-[#D8A83E]" />{notice}<button onClick={() => setNotice('')} aria-label="إغلاق" className="mr-1"><X size={14} /></button></div>}
      </div>
    </div>
  );
}

function ListingGrid({ items, saved, onOpen, onSave }: { items: Listing[]; saved: string[]; onOpen: (item: Listing) => void; onSave: (id: string) => void }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <article key={item.id} className="overflow-hidden rounded-2xl border border-[#D8D5CC] bg-white"><div className="relative flex h-28 items-center justify-center overflow-hidden bg-[#EAE4D8]"><div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-radial-gradient(ellipse at 80% 30%, transparent 0 18px, #B9AD98 19px 20px, transparent 21px 36px)' }} /><span className="relative rounded-full border border-[#C9BDA9] bg-white/80 px-3 py-1 text-[10px] font-bold text-[#8B6B37]">مثال توضيحي · ليس موقعاً حقيقياً</span></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><h3 className="text-sm font-black">{item.name}</h3><p className="mt-1 text-[11px] text-[#64716A]">{item.category} · {item.district}</p></div><button onClick={() => onSave(item.id)} aria-label={saved.includes(item.id) ? 'إزالة من المحفوظات' : 'حفظ'} className={`rounded-full p-2 ${saved.includes(item.id) ? 'bg-[#F7EBD1] text-[#9A6B1F]' : 'bg-[#F4F1EA] text-[#64716A]'}`}><Heart size={16} fill={saved.includes(item.id) ? 'currentColor' : 'none'} /></button></div><div className="mt-4 flex items-center justify-between border-t border-[#EEEAE2] pt-3"><span className="text-[10px] font-bold text-[#9A7740]">{item.status}</span><button onClick={() => onOpen(item)} className="text-xs font-black text-[#123C32]">التفاصيل ←</button></div></div></article>)}</div>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#18201D]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-[#FBFAF7] p-6 shadow-2xl sm:rounded-[28px]"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-black">{title}</h2><button onClick={onClose} aria-label="إغلاق النافذة" className="rounded-full bg-[#EEEAE2] p-2"><X size={18} /></button></div>{children}</section></div>;
}

function ModuleDemo({ id, cart, total, cartCount, onAdd, bookingSent, onBooking, contributionSent, onContribution }: { id: string; cart: Record<string, number>; total: number; cartCount: number; onAdd: (id: string) => void; bookingSent: boolean; onBooking: () => void; contributionSent: boolean; onContribution: () => void }) {
  if (id === 'market') return <div className="space-y-4"><p className="text-xs leading-6 text-[#64716A]">سوق تجريبي بمنتجات وقيم افتراضية. لا توجد مدفوعات أو طلبات حقيقية.</p>{products.map((product) => <div key={product.id} className="flex items-center justify-between rounded-xl border border-[#E5E0D6] bg-white p-3"><div><p className="text-sm font-bold">{product.name}</p><p className="mt-1 text-[10px] text-[#64716A]">{product.price.toLocaleString('ar')} {product.unit}</p><p className="mt-1 text-xs font-black text-[#123C32]">الكمية: {cart[product.id] || 0}</p></div><button onClick={() => onAdd(product.id)} className="rounded-lg bg-[#123C32] px-3 py-2 text-xs font-bold text-white">إضافة +</button></div>)}<div className="rounded-xl bg-[#F4F1EA] p-4 text-sm"><div className="flex justify-between"><span>عدد القطع</span><strong>{cartCount}</strong></div><div className="mt-2 flex justify-between"><span>الإجمالي الافتراضي</span><strong>{total.toLocaleString('ar')} ر.ي</strong></div></div></div>;
  if (id === 'booking') return <div className="space-y-4"><p className="text-xs leading-6 text-[#64716A]">أرسل طلب موعد تجريبي. لا يتم حجز موعد لدى مقدم خدمة حقيقي.</p><label className="block text-xs font-bold">نوع الخدمة<select className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-white p-3 text-sm"><option>موعد خدمة عامة</option><option>مطعم أو مقهى</option><option>إقامة فندقية</option><option>نشاط سياحي</option></select></label><label className="block text-xs font-bold">التاريخ<input type="date" className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-white p-3 text-sm" /></label><label className="block text-xs font-bold">ملاحظات<textarea className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-white p-3 text-sm" rows={3} placeholder="تفاصيل اختيارية" /></label><button onClick={onBooking} className="w-full rounded-xl bg-[#123C32] p-3 text-sm font-bold text-white">إرسال طلب تجريبي</button>{bookingSent && <p role="status" className="rounded-xl bg-[#E6ECE7] p-3 text-xs font-bold text-[#123C32]">تم تسجيل الطلب في حالة العرض التجريبي فقط.</p>}</div>;
  if (id === 'community') return <div className="space-y-4"><p className="text-xs leading-6 text-[#64716A]">نموذج مساهمة توضيحي، لا يرسل بيانات إلى الخادم.</p><label className="block text-xs font-bold">اسم المكان المقترح<input className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-white p-3 text-sm" placeholder="اكتب اسماً وصفياً" /></label><label className="block text-xs font-bold">نوع المساهمة<select className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-white p-3 text-sm"><option>اقتراح مكان جديد</option><option>تصحيح بيانات</option><option>الإبلاغ عن معلومة غير دقيقة</option></select></label><label className="block text-xs font-bold">تفاصيل<textarea rows={3} className="mt-2 w-full rounded-xl border border-[#D8D5CC] bg-white p-3 text-sm" placeholder="اشرح المعلومة ومصدرها إن وجد" /></label><button onClick={onContribution} className="w-full rounded-xl bg-[#123C32] p-3 text-sm font-bold text-white">حفظ المساهمة التجريبية</button>{contributionSent && <p role="status" className="rounded-xl bg-[#E6ECE7] p-3 text-xs font-bold text-[#123C32]">حُفظت حالة العرض محلياً: قيد المراجعة (تجريبي).</p>}</div>;
  const descriptions: Record<string, string> = {
    delivery: 'مسار توضيحي لإنشاء طلب توصيل، تحديد نقطة استلام ووجهة، ثم متابعة حالات مثل: تم الاستلام، في الطريق، تم التسليم. لا يوجد تتبع GPS أو تسعير فعلي.',
    business: 'تجربة توضيحية لملف النشاط التجاري، الخدمات، المنتجات، الفروع، وطلب إثبات الملكية. لا يظهر شارة توثيق إلا بعد اعتماد حقيقي.',
    admin: 'لوحة عرض توضيحية لمراجعة طلبات المساهمات والبلاغات وطلبات التوثيق. الأرقام والسجلات ليست إحصاءات فعلية ولا توجد صلاحيات إدارية متصلة.',
  };
  return <div className="space-y-4"><p className="text-sm leading-7 text-[#64716A]">{descriptions[id] || 'هذه الوحدة جزء من الرؤية المستقبلية للمنصة، وتحتاج إلى تكامل خلفي قبل تشغيلها فعلياً.'}</p><div className="rounded-xl bg-[#F4F1EA] p-4 text-xs leading-7"><p>الحالة: نموذج واجهة تجريبي</p><p>البيانات: غير متصلة بقاعدة الإنتاج</p><p>التكامل الخارجي: غير مفعّل</p></div></div>;
}
