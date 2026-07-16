import { NextResponse } from 'next/server';
import { getUser } from '@/lib/supabase/server';
import { exportMemory } from '@/lib/memory/server';

/** Download everything ATTIRA remembers about you, as JSON. Never train on it. */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });

  const data = await exportMemory(user.id);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'content-type': 'application/json',
      'content-disposition': 'attachment; filename="attira-memory.json"',
    },
  });
}
