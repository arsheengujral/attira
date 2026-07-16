import { NextRequest, NextResponse } from 'next/server';
import { getUser, createServerSupabase } from '@/lib/supabase/server';
import { analyzeIngredients, type AnalyzerInput } from '@/lib/skin/analyze';

export const dynamic = 'force-dynamic';

/**
 * Ingredient-list analyser endpoint (§12). Enriches the deterministic analysis
 * with the signed-in user's profile (type/concerns/allergies/pregnancy) and
 * their shelf (products) for redundancy + conflict checks. Works signed-out too,
 * just with no personalisation.
 */
export async function POST(req: NextRequest) {
  let body: { inci?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const inci = (body.inci ?? '').trim();
  if (!inci) return NextResponse.json({ error: 'Paste an ingredient list first.' }, { status: 400 });

  const input: AnalyzerInput = { inci };

  const user = await getUser();
  const supabase = createServerSupabase();
  if (user && supabase) {
    const { data: mp } = await supabase
      .from('module_profiles')
      .select('data')
      .eq('user_id', user.id)
      .eq('module_id', 'skin')
      .maybeSingle();
    const blob = (mp?.data ?? {}) as Record<string, unknown>;
    if (typeof blob.type === 'string') input.skinType = blob.type;
    if (Array.isArray(blob.concerns)) input.concerns = blob.concerns as string[];
    if (Array.isArray(blob.allergies)) input.allergies = blob.allergies as string[];
    input.pregnant = Boolean(blob.pregnant);
    input.fungalAcneProne = Boolean(blob.fungalAcneProne);

    const { data: products } = await supabase.from('products').select('ingredients').eq('user_id', user.id);
    if (products) {
      input.shelfActives = products.flatMap((p) => (Array.isArray(p.ingredients) ? p.ingredients : []));
    }
  }

  return NextResponse.json(analyzeIngredients(input));
}
