import { NextRequest, NextResponse } from 'next/server';
import { runSkinCoach } from '@/lib/skin/coach';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * The Skin Coach endpoint. Returns rich "cards" (answer / ingredient / referral)
 * plus quick-reply chips — the conversation-card screen renders these, never raw
 * chat bubbles. Works without a login (memory is simply empty) and without the
 * model (safety + library still respond).
 */
export async function POST(req: NextRequest) {
  let body: { message?: string; history?: { role: 'user' | 'assistant'; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const message = (body.message ?? '').trim();
  if (!message) return NextResponse.json({ error: 'Say something first.' }, { status: 400 });
  if (message.length > 2000) return NextResponse.json({ error: 'That’s a lot — try a shorter question.' }, { status: 400 });

  try {
    const reply = await runSkinCoach({ message, history: body.history });
    return NextResponse.json(reply);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'The guide is unavailable right now.' },
      { status: 500 },
    );
  }
}
