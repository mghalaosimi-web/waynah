import React from 'react';
import { Badge } from '@waynah/ui';

export interface StatusBadgeProps {
  status: 'PENDING' | 'AUTO_APPROVED' | 'MANUAL_REVIEW' | 'CONFLICT' | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'AUTO_APPROVED':
      return <Badge variant="success">مكتشف وموثق تلقائياً</Badge>;
    case 'MANUAL_REVIEW':
      return <Badge variant="warning">مراجعة يدوية</Badge>;
    case 'CONFLICT':
      return <Badge variant="error">تعارض بيانات</Badge>;
    case 'PENDING':
    default:
      return <Badge variant="secondary">قيد المعالجة</Badge>;
  }
};
