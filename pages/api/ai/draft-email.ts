import type { NextApiRequest, NextApiResponse } from 'next';
import Anthropic from '@anthropic-ai/sdk';
import { getUserId } from '@/lib/auth-middleware';
import { connectDB } from '@/lib/mongodb';
import Contact from '@/models/Contact';
import UserSettings from '@/models/UserSettings';

const anthropic = new Anthropic();

const BASE_SYSTEM = `You are helping Mina Andrawis, a photographer in Charleston, SC, write personalized cold outreach emails to potential clients and business contacts.

Mina shoots: portraits, headshots, branding, events, real estate, family sessions, and proposals.

Write warm, genuine outreach that doesn't feel templated. Show you've actually looked at their business.

Rules:
- 150–250 words total
- Open with something specific to them — a real observation, not empty flattery
- Explain concretely why professional photography would benefit their specific type of business
- One clear, low-pressure ask at the end (30-minute call, quick portfolio peek, coffee)
- Sign off as: Mina
- NEVER use: "I hope this email finds you well", "reaching out to", "circle back", "touch base", "synergy"`;

function buildSystemPrompt(writingStyle: string): string {
  if (!writingStyle.trim()) return BASE_SYSTEM;
  return `${BASE_SYSTEM}

IMPORTANT — Voice and style:
Mina has provided samples of her own writing below. Study the vocabulary, sentence length, punctuation habits, tone, and personality. Write the email in her voice, not in polished corporate prose.

--- MINA'S WRITING SAMPLES ---
${writingStyle.trim()}
--- END SAMPLES ---

Match her style closely. If she writes casually, be casual. If she uses short punchy sentences, do the same. The goal is that when she reads the draft, it sounds like her — not like an AI wrote it.`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const userId = await getUserId(req, res);
  if (!userId) return;

  const { contactId } = req.body as { contactId: string };
  if (!contactId) return res.status(400).json({ error: 'contactId required' });

  await connectDB();

  const [contact, settings] = await Promise.all([
    Contact.findOne({ _id: contactId, userId }).lean() as Promise<Record<string, unknown> | null>,
    UserSettings.findOne({ userId }).lean() as Promise<Record<string, unknown> | null>,
  ]);

  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const writingStyle = (settings?.writingStyle as string) ?? '';

  const details = [
    `Name: ${contact.name}`,
    contact.businessName ? `Business: ${contact.businessName}` : null,
    `Type: ${contact.type}`,
    contact.instagram ? `Instagram: ${contact.instagram}` : null,
    contact.website ? `Website: ${contact.website}` : null,
    contact.specialty ? `Their specialty/niche: ${contact.specialty}` : null,
    contact.city ? `City: ${contact.city}` : null,
    Array.isArray(contact.tags) && contact.tags.length ? `Tags: ${(contact.tags as string[]).join(', ')}` : null,
    contact.notes ? `Notes: ${contact.notes}` : null,
  ].filter(Boolean).join('\n');

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system: buildSystemPrompt(writingStyle),
    tools: [
      {
        name: 'draft_email',
        description: 'Output the completed email subject line and body',
        input_schema: {
          type: 'object' as const,
          properties: {
            subject: { type: 'string', description: 'Email subject line (concise, specific)' },
            body: { type: 'string', description: 'Full email body as plain text. Use \\n for line breaks.' },
          },
          required: ['subject', 'body'],
        },
      },
    ],
    tool_choice: { type: 'tool' as const, name: 'draft_email' },
    messages: [
      {
        role: 'user',
        content: `Draft a cold outreach email from Mina to this contact:\n\n${details}`,
      },
    ],
  });

  const toolUse = message.content.find(b => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    return res.status(500).json({ error: 'No draft generated' });
  }

  return res.status(200).json(toolUse.input);
}
