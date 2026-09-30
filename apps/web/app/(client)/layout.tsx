import React from 'react';
import { ClientShell } from '../../components/navigation/ClientShell';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <ClientShell>{children}</ClientShell>;
}

