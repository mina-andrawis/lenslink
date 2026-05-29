import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  const [writingStyle, setWritingStyle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // fetch GET /api/settings and set writingStyle state
    const fetchSettings = async () => {
      if (!user) return;
      try {
        const data = await apiFetch<{ writingStyle: string }>('/api/settings', user);
        setWritingStyle(data.writingStyle || '');
      } catch (error) {
        toast.error('Failed to load settings');
      }
    };
    fetchSettings();   
  }, [user]);

  const handleSave = async () => {
    // PUT /api/settings with { writingStyle }
    // toast.success on done
    if (!user) return;
    setSaving(true);
    try{
        await apiFetch<{ ok: boolean }>('/api/settings', user, {
            method: 'PUT',
            body: JSON.stringify({ writingStyle }),
        });
        toast.success('Settings saved');
    } catch (error) {
        toast.error('Failed to save settings');
    } finally {
        setSaving(false);
    }
  };

  return (
    <AuthGuard>
      <Layout>
        <div className="p-4 md:p-8 max-w-2xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your writing style for AI-generated emails</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">Your writing style</label>
              <p className="text-xs text-gray-500 mb-3">Paste examples of how you write — emails, DMs, captions, anything. The more you add, the more drafts will sound like you.</p>
              <textarea
                value={writingStyle}
                onChange={(e) => setWritingStyle(e.target.value)}
                rows={16}
                placeholder={`Hey! Saw your café on Instagram and absolutely love the vibe you've created…`}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </AuthGuard>
  );
}
