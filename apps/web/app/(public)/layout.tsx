import React from 'react';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full min-h-screen">{children}</div>;
}
