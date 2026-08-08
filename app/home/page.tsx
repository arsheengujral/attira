import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { Dashboard, type DashModule } from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

const SKIN_SWATCH: [string, string] = ['#EBE0F2', '#B9A8D9'];
const STYLE_SWATCH: [string, string] = ['#F2E3C8', '#DDBC85'];

function deriveName(email?: string | null): string {
  if (!email) return 'there';
  const local = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
  if (!local) return 'there';
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function lifeScoreOf(scores: (number | null)[]): number | null {
  const present = scores.filter((s): s is number => typeof s === 'number');
  if (!present.length) return null;
  return Math.round(present.reduce((a, b) => a + b, 0) / present.length);
}

export default async function HomePage() {
  const supabase = createServerSupabase();

  // Degraded / preview mode — no Supabase configured. Show a demo dashboard.
  if (!supabase) {
    const modules: DashModule[] = [
      { id: 'skin', name: 'Skin', tag: 'Sk', score: 82, status: 'Week 6 · your ritual is going strong', href: '/skin', cta: 'Continue', swatch: SKIN_SWATCH, ink: '#4E4066' },
      { id: 'style', name: 'Style', tag: 'St', score: null, status: 'Set up your style profile', href: '/style', cta: 'Set up', swatch: STYLE_SWATCH, ink: '#6B5320' },
    ];
    return (
      <Dashboard
        name="Maya"
        lifeScore={82}
        streak={12}
        modules={modules}
        brief="Your skin’s been calmer every week this month — tonight’s ritual closes your day ring."
      />
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/home');

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!profile?.onboarded_at) redirect('/onboarding');

  // Module scores from module_profiles.
  const { data: mps } = await supabase
    .from('module_profiles')
    .select('module_id, score')
    .eq('user_id', user.id);
  const scoreOf = (id: string) => {
    const row = (mps ?? []).find((m) => m.module_id === id);
    return typeof row?.score === 'number' ? row.score : null;
  };
  const skinScore = scoreOf('skin');
  const styleScore = scoreOf('style');

  const { data: streakRow } = await supabase
    .from('streaks')
    .select('current')
    .eq('user_id', user.id)
    .eq('module_id', 'skin')
    .maybeSingle();
  const streak = streakRow?.current ?? 0;

  const modules: DashModule[] = [
    {
      id: 'skin',
      name: 'Skin',
      tag: 'Sk',
      score: skinScore,
      status: skinScore == null ? 'Do your first check-in to find your baseline' : `${streak ? `${streak}-day streak · ` : ''}keep it going`,
      href: '/skin',
      cta: skinScore == null ? 'Begin' : 'Continue',
      swatch: SKIN_SWATCH,
      ink: '#4E4066',
    },
    {
      id: 'style',
      name: 'Style',
      tag: 'St',
      score: styleScore,
      status: styleScore == null ? 'Take the style assessment' : 'Your style profile is ready',
      href: '/style',
      cta: styleScore == null ? 'Set up' : 'Open',
      swatch: STYLE_SWATCH,
      ink: '#6B5320',
    },
  ];

  const brief =
    skinScore == null && styleScore == null
      ? 'Two quick starts below and ATTIRA begins to learn you — your skin first, then your style.'
      : 'Small and steady is exactly how this works. Pick up where you left off below.';

  return (
    <Dashboard
      name={deriveName(user.email)}
      lifeScore={lifeScoreOf([skinScore, styleScore])}
      streak={streak}
      modules={modules}
      brief={brief}
    />
  );
}
