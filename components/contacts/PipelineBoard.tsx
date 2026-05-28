import { useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import type { Contact, ContactStatus } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/24/outline';

interface PipelineBoardProps {
  contacts: Contact[];
  onStatusChange?: (contactId: string, newStatus: ContactStatus) => void;
}

// Past clients get their own tab — keep them off the board
const BOARD_STAGES = PIPELINE_STAGES.filter(s => s.key !== 'past_client');

export default function PipelineBoard({ contacts, onStatusChange }: PipelineBoardProps) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  const grouped = BOARD_STAGES.reduce<Record<string, Contact[]>>((acc, stage) => {
    acc[stage.key] = contacts.filter(c => c.status === stage.key);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {BOARD_STAGES.map((stage) => (
        <div
          key={stage.key}
          className="flex-shrink-0 w-64"
          onDragOver={(e) => { e.preventDefault(); setDropTarget(stage.key); }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (draggingId) onStatusChange?.(draggingId, stage.key as ContactStatus);
            setDraggingId(null);
            setDropTarget(null);
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${stage.color}`}>
              {stage.label}
            </span>
            <span className="text-xs text-gray-600">{grouped[stage.key].length}</span>
          </div>

          <div className={`space-y-2 min-h-16 rounded-xl p-1 transition-colors ${
            dropTarget === stage.key ? 'bg-indigo-50 ring-2 ring-indigo-200' : ''
          }`}>
            {grouped[stage.key].map((contact) => (
              <div
                key={contact._id}
                draggable
                onDragStart={(e) => {
                  setDraggingId(contact._id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => { setDraggingId(null); setDropTarget(null); }}
                onClick={() => router.push(`/contacts/${contact._id}`)}
                className={`rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none ${
                  draggingId === contact._id ? 'opacity-40 scale-95' : ''
                }`}
              >
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
            ))}

            {grouped[stage.key].length === 0 && (
              <div className={`rounded-xl border border-dashed p-4 text-center text-xs transition-colors ${
                dropTarget === stage.key
                  ? 'border-indigo-300 text-indigo-400'
                  : 'border-gray-200 text-gray-500'
              }`}>
                {dropTarget === stage.key ? 'Drop here' : 'No contacts'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
