import { PIPELINE_STAGES } from '@/types';
import type { ContactStatus } from '@/types';

export function StatusBadge({ status }: { status: ContactStatus }) {
  const stage = PIPELINE_STAGES.find((s) => s.key === status);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${stage?.color ?? 'bg-gray-100 text-gray-700'}`}>
      {stage?.label ?? status}
    </span>
  );
}
