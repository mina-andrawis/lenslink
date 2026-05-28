import Link from 'next/link';
import { format } from 'date-fns';
import type { Contact } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { StatusBadge } from '@/components/ui/Badge';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface PipelineBoardProps {
  contacts: Contact[];
}

export default function PipelineBoard({ contacts }: PipelineBoardProps) {
  const grouped = PIPELINE_STAGES.reduce<Record<string, Contact[]>>((acc, stage) => {
    acc[stage.key] = contacts.filter((c) => c.status === stage.key);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage.key} className="flex-shrink-0 w-64">
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
              {stage.label}
            </span>
            <span className="text-xs text-gray-600">{grouped[stage.key].length}</span>
          </div>
          <div className="space-y-2">
            {grouped[stage.key].map((contact) => (
              <Link key={contact._id} href={`/contacts/${contact._id}`}>
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <p className="font-medium text-sm text-gray-900 truncate">{contact.name}</p>
                  {contact.businessName && (
                    <p className="text-xs text-gray-700 truncate">{contact.businessName}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                    <EnvelopeIcon className="h-3.5 w-3.5" />
                    <span className="truncate">{contact.email}</span>
                  </div>
                  {contact.phone && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                      <PhoneIcon className="h-3.5 w-3.5" />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.followUpDate && (
                    <div className="mt-2 text-xs text-amber-600 font-medium">
                      Follow up: {format(new Date(contact.followUpDate), 'MMM d')}
                    </div>
                  )}
                  {contact.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {contact.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
            {grouped[stage.key].length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-xs text-gray-600">
                No contacts
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
