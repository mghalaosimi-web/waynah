export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Navigation */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tight text-emerald-400">وينه؟ WAYNAH</span>
            <span className="text-xs bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
              Admin Intelligence
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium">
            <a
              href="/admin"
              className="text-slate-300 hover:text-white transition-colors duration-150"
            >
              الرئيسية
            </a>
            <a
              href="/admin/geography"
              className="text-slate-300 hover:text-white transition-colors duration-150"
            >
              إدارة الجغرافيا (Geography UI)
            </a>
            <a
              href="/admin/verifications"
              className="text-slate-300 hover:text-white transition-colors duration-150"
            >
              مراجعة التوثيق (Verifications Queue)
            </a>
            <a
              href="/admin/conflicts"
              className="text-slate-300 hover:text-white transition-colors duration-150"
            >
              طابور النزاعات (Conflicts Queue)
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        منصة وينه؟ المكانية للاستكشاف المحلي - لوحة الذكاء وحل تعارضات البيانات
      </footer>
    </div>
  );
}
