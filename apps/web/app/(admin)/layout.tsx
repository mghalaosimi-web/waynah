import React from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-900">{children}</div>;
}
