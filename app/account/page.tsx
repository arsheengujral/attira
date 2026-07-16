import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { signOut } from '@/lib/actions';
import { PageShell, INK, INK_SOFT, LAV } from '@/components/foundation';

export const dynamic = 'force-dynamic';

const LABELS: Record<string, string> = {
  age_band: 'Age band',
  gender: 'Gender',
  city: 'City',
  country: 'Country',
  climate: 'Climate',
  occupation: 'Occupation',
  lifestyle: 'Lifestyle',
  budget_band: 'Budget',
  relationship_status: 'Relationship',
};

export default async function AccountPage() {
  const supabase = createServerSupabase();
  if (!supabase) redirect('/auth');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/account');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const onboarded = Boolean(profile?.onboarded_at);
  const rows = Object.entries(LABELS)
    .map(([k, label]) => [label, profile?.[k]] as const)
    .filter(([, v]) => Boolean(v));
  const goals: string[] = Array.isArray(profile?.goals) ? profile!.goals : [];

  return (
    <PageShell eyebrow="Your account" title={`Hello${profile?.city ? `, ${profile.city}` : ''}` } maxWidth={520}>
      <div style={{ fontSize: 13, color: INK_SOFT, marginBottom: 4 }}>Signed in as</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: INK, marginBottom: 18 }}>{user.email}</div>

      {!onboarded ? (
        <div
          style={{
            fontSize: 13.5,
            color: INK,
            background: 'rgba(138,118,180,.08)',
            border: '1px solid rgba(138,118,180,.25)',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 18,
            lineHeight: 1.55,
          }}
        >
          Your profile isn’t set up yet.{' '}
          <Link href="/onboarding" style={{ color: LAV, fontWeight: 600 }}>
            Set it up →
          </Link>
        </div>
      ) : (
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 10.5,
              letterSpacing: 1.4,
              textTransform: 'uppercase',
              color: INK_SOFT,
              fontWeight: 600,
              marginBottom: 10,
            }}
          >
            Your saved profile
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px' }}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: INK_SOFT }}>{label}</div>
                <div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{String(value)}</div>
              </div>
            ))}
          </div>
          {goals.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: INK_SOFT, marginBottom: 6 }}>Working toward</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {goals.map((g) => (
                  <span
                    key={g}
                    style={{
                      fontSize: 12,
                      padding: '5px 11px',
                      borderRadius: 999,
                      background: 'rgba(138,118,180,.1)',
                      color: '#5c5168',
                    }}
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Link href="/onboarding" style={{ display: 'inline-block', marginTop: 14, color: LAV, fontWeight: 600, fontSize: 13 }}>
            Edit profile →
          </Link>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, borderTop: '1px solid rgba(36,30,46,.1)', paddingTop: 18 }}>
        <Link href="/memory" style={pill}>Your memory</Link>
        <Link href="/" style={pill}>Skin preview</Link>
        <form action={signOut} style={{ marginLeft: 'auto' }}>
          <button type="submit" style={{ ...pill, border: '1px solid rgba(36,30,46,.15)', background: 'transparent', cursor: 'pointer', color: INK_SOFT }}>
            Sign out
          </button>
        </form>
      </div>
    </PageShell>
  );
}

const pill: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#5c5168',
  background: 'rgba(138,118,180,.1)',
  padding: '9px 15px',
  borderRadius: 999,
  textDecoration: 'none',
};
