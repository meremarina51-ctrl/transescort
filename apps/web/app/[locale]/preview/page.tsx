'use client';

import { PreviewContent } from '@/components/preview/PreviewContent';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Role } from '@/lib/enums';

export default function PreviewPage() {
  return (
    <ProtectedRoute requiredRoles={[Role.Performer]}>
      <PreviewContent />
    </ProtectedRoute>
  );
};
