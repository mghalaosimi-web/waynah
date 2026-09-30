import React from 'react';
import { Container, PageHeader } from '@waynah/ui';

export default function AdminPlacesPage() {
  return (
    <Container size="xl" className="py-8">
      <PageHeader title="إدارة الأماكن والملاحظات" subtitle="مراجعة تاريخ المعرفة وسجل التعديلات" />
    </Container>
  );
}
