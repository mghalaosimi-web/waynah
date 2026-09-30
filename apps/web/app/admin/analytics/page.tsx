import React from 'react';
import { Container, PageHeader } from '@waynah/ui';

export default function AdminAnalyticsPage() {
  return (
    <Container size="xl" className="py-8">
      <PageHeader title="تحليلات النظام" subtitle="إحصائيات الإدخال وجودة البيانات" />
    </Container>
  );
}
