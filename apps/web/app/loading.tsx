import React from 'react';
import { Container, Spinner } from '@waynah/ui';

export default function Loading() {
  return (
    <Container size="md" className="py-20 flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center">
      <Spinner size="lg" className="text-primary-600" />
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">جاري تحميل منصة وينه؟...</span>
    </Container>
  );
}
