import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import toast from 'react-hot-toast';
import type { Contact, ContactStatus, ContactType } from '@/types';

const VALID_TYPES: ContactType[] = ['prospect', 'client', 'photographer'];
const VALID_STATUSES: ContactStatus[] = [
  'lead', 'contacted', 'proposal_sent', 'booked', 'past_client', 'not_interested',
];

// Maps normalized header → Contact field name (or __special__ key)
const COLUMN_MAP: Record<string, string> = {
  name: 'name',
  email: 'email',
  phone: 'phone',
  business: 'businessName',
  businessname: 'businessName',
  company: 'businessName',
  website: 'website',
  instagram: 'instagram',
  specialty: 'specialty',
  city: 'city',
  notes: 'notes',
  type: 'type',
  status: 'status',
  tags: 'tags',
  followup: 'followUpDate',
  followupdate: 'followUpDate',
  // Event-specific extras — merged into notes
  eventdate: '__eventDate',
  eventday: '__eventDate',
  date: '__eventDate',
  venue: '__venue',
  location: '__venue',
  organizer: '__organizer',
  contactperson: '__contactPerson',
  contact: '__contactPerson',
};

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQuotes) {
      inQuotes = true;
    } else if (ch === '"' && inQuotes) {
      if (line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = false;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function formatEventDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function buildNotes(raw: Record<string, string>): string {
  const parts: string[] = [];
  if (raw.__venue)         parts.push(`Venue: ${raw.__venue}`);
  if (raw.__organizer)     parts.push(`Organizer: ${raw.__organizer}`);
  if (raw.__contactPerson) parts.push(`Contact: ${raw.__contactPerson}`);
  if (raw.notes)           parts.push(raw.notes);
  return parts.join(' · ');
}

function parseCsv(text: string): Partial<Contact>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const rawHeaders = parseRow(lines[0]);
  const fields = rawHeaders.map(h =>
    COLUMN_MAP[h.toLowerCase().replace(/[\s\-_]/g, '')] ?? null
  );

  const rows: Partial<Contact>[] = [];
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const vals = parseRow(line);
    const raw: Record<string, string> = {};
    fields.forEach((f, i) => { if (f) raw[f] = vals[i]?.trim() ?? ''; });

    if (!raw.name) continue;

    const type = VALID_TYPES.includes(raw.type as ContactType) ? (raw.type as ContactType) : 'prospect';
    const status = VALID_STATUSES.includes(raw.status as ContactStatus) ? (raw.status as ContactStatus) : 'lead';
    const tags = raw.tags ? raw.tags.split(/[;|]/).map(t => t.trim()).filter(Boolean) : [];
    const followUpDate = raw.followUpDate && !isNaN(Date.parse(raw.followUpDate))
      ? new Date(raw.followUpDate).toISOString()
      : undefined;
    const notes = buildNotes(raw) || undefined;
    const eventDate = raw.__eventDate && !isNaN(Date.parse(raw.__eventDate))
      ? new Date(raw.__eventDate).toISOString()
      : undefined;

    rows.push({
      name: raw.name,
      ...(raw.email        ? { email: raw.email }               : {}),
      ...(raw.phone        ? { phone: raw.phone }               : {}),
      ...(raw.businessName ? { businessName: raw.businessName } : {}),
      ...(raw.website      ? { website: raw.website }           : {}),
      ...(raw.instagram    ? { instagram: raw.instagram }       : {}),
      ...(raw.specialty    ? { specialty: raw.specialty }       : {}),
      ...(raw.city         ? { city: raw.city }                 : {}),
      ...(notes            ? { notes }                          : {}),
      ...(followUpDate     ? { followUpDate }                   : {}),
      ...(eventDate        ? { eventDate }                      : {}),
      type,
      status,
      tags,
    });
  }
  return rows;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export default function CsvImportModal({ open, onClose, onImported }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<Partial<Contact>[]>([]);
  const [fileName, setFileName] = useState('');
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function downloadTemplate() {
    const headers = 'name,email,phone,business,website,city,eventDate,venue,organizer,contactPerson,notes,type,status,tags,followUpDate';
    const example = 'Charleston Farmers Market,culturalaffairs@charleston-sc.gov,843-724-7305,City of Charleston Office of Cultural Affairs,charlestonfarmersmarket.com,Charleston SC,2026-07-05,Marion Square,City of Charleston,Cultural Affairs Office,Weekly Saturday market 8AM-1PM. Great for street photography and environmental portraits.,prospect,lead,Farmers Market|Street Photography|Portrait,2026-06-28';
    const blob = new Blob([headers + '\n' + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a .csv file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        toast.error('No valid rows found. Make sure the CSV has a "name" column.');
        return;
      }
      setRows(parsed);
      setFileName(file.name);
    };
    reader.readAsText(file);
  }

  function onFileInput(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function reset() {
    setRows([]);
    setFileName('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleImport() {
    if (!user || rows.length === 0) return;
    setImporting(true);
    try {
      const { inserted } = await apiFetch<{ inserted: number }>('/api/contacts/import', user, {
        method: 'POST',
        body: JSON.stringify({ contacts: rows }),
      });
      toast.success(`Imported ${inserted} contact${inserted !== 1 ? 's' : ''}`);
      reset();
      onClose();
      onImported();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  const preview = rows.slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-xl bg-white shadow-xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">Import Contacts from CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {rows.length === 0 ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                  dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                <ArrowUpTrayIcon className="h-8 w-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Drop your CSV here, or click to browse</p>
                  <p className="text-xs text-gray-500 mt-1">Only .csv files are supported</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileInput} />
              </div>

              {/* Template + column reference */}
              <div className="mt-4 rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">Supported columns</p>
                  <button
                    onClick={downloadTemplate}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
                  >
                    Download template CSV
                  </button>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Contact info</p>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    name, email, phone, business, website, city, instagram, specialty, notes
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Event / opportunity info</p>
                  <p className="text-xs text-gray-400 font-mono leading-relaxed">
                    eventDate, venue, organizer, contactPerson
                  </p>
                  <p className="text-xs text-gray-400 mt-1">These get combined into the notes field automatically.</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1 font-medium">Pipeline</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="font-medium">type:</span> prospect / client / photographer &nbsp;·&nbsp;
                    <span className="font-medium">status:</span> lead / contacted / proposal_sent / booked &nbsp;·&nbsp;
                    <span className="font-medium">tags:</span> separate with <code className="bg-gray-200 px-1 rounded">|</code> &nbsp;·&nbsp;
                    <span className="font-medium">followUpDate:</span> YYYY-MM-DD
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* File confirmed + preview */}
              <div className="flex items-center gap-3 mb-4">
                <DocumentTextIcon className="h-5 w-5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
                  <p className="text-xs text-gray-500">{rows.length} row{rows.length !== 1 ? 's' : ''} ready to import</p>
                </div>
                <button onClick={reset} className="ml-auto text-xs text-gray-500 hover:text-gray-700 underline shrink-0">
                  Change file
                </button>
              </div>

              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Name', 'Email', 'Business', 'Type', 'Notes preview'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((r, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-gray-900 truncate max-w-30">{r.name}</td>
                        <td className="px-3 py-2 text-gray-600 truncate max-w-36">{r.email ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600 truncate max-w-30">{r.businessName ?? '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{r.type}</td>
                        <td className="px-3 py-2 text-gray-400 truncate max-w-40">{r.notes ?? '—'}</td>
                      </tr>
                    ))}
                    {rows.length > 5 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-gray-400 italic">
                          …and {rows.length - 5} more
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={rows.length === 0 || importing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {importing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <ArrowUpTrayIcon className="h-4 w-4" />
            )}
            {importing ? 'Importing…' : `Import${rows.length > 0 ? ` ${rows.length}` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
