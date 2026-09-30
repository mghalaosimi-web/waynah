export const metadata = {
  title: 'WAYNAH - Admin Intelligence Dashboard',
  description: 'Local Discovery & Geospatial Platform for Yemen',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html dir="rtl" lang="ar">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
