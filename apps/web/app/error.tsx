'use client';

import React from 'react';
import { Container, ErrorState } from '@waynah/ui';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Container size="md" className="py-20 flex flex-col items-center justify-center min-h-[50vh]">
      <ErrorState
        title="حدث خطأ أثناء تحميل الواجهة"
        message={error.message || 'عذراً، حدث خطأ غير متوقع أثناء معالجة الطلب.'}
        onRetry={() => reset()}
      />
    </Container>
  );
}
