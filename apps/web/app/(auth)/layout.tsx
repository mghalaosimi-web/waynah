import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">{children}</div>;
}
