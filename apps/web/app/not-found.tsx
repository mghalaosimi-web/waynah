import React from 'react';
import Link from 'next/link';
import { Container, Button, EmptyState } from '@waynah/ui';

export default function NotFound() {
  return (
    <Container size="md" className="py-20 flex flex-col items-center justify-center min-h-[60vh] text-center">
      <EmptyState
        title="404 — الصفحة غير موجودة"
        description="الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها إلى عنوان آخر."
      />
      <div className="mt-6">
        <Link href="/">
          <Button variant="primary">العودة إلى الصفحة الرئيسية</Button>
        </Link>
      </div>
    </Container>
  );
}
