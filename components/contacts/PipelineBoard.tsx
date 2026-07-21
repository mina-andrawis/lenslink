import { useState } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import type { Contact, ContactStatus } from '@/types';
import { PIPELINE_STAGES } from '@/types';
import { EnvelopeIcon, PhoneIcon, XMarkIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface PipelineBoardProps {
  contacts: Contact[];
  onStatusChange?: (contactId: string, newStatus: ContactStatus) => void;
  onDelete?: (contactId: string) => void;
}

// Past clients get their own tab — keep them off the board
const BOARD_STAGES = PIPELINE_STAGES.filter(s => s.key !== 'past_client');

export default function PipelineBoard({ contacts, onStatusChange, onDelete }: PipelineBoardProps) {
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
                className={`relative group rounded-xl border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none ${
                  draggingId === contact._id ? 'opacity-40 scale-95' : ''
                }`}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete?.(contact._id); }}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="absolute top-2 right-2 rounded-full p-0.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>

                {contact.eventDate && (
                  <div className="mb-2 -mx-3 -mt-3 rounded-t-xl bg-indigo-600 px-3 py-1.5 text-center text-xs font-bold text-white tracking-wide">
                    {format(new Date(contact.eventDate), 'EEE, MMM d')}
                  </div>
                )}
                <p className="font-medium text-sm text-gray-900 truncate pr-5">{contact.name}</p>
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
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      <CalendarDaysIcon className="h-3 w-3" />
                      {format(new Date(contact.followUpDate), 'MMM d')}
                    </span>
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
