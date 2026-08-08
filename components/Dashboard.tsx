import Link from 'next/link';
import { PhoneFrame, Screen } from './shell';
import { Ring } from './ui';
import { signOut } from '@/lib/actions';

export interface DashModule {
  id: string;
  name: string;
  tag: string;
  score: number | null;
  status: string;
  href: string;
  cta: string;
  swatch: [string, string];
  ink: string;
}

/**
 * The home base — the shell that ties the modules into one product. Greeting,
 * Life Score (aggregate), a card per module, and the quiet links (memory,
 * settings, sign out). Everything is reached from here.
 */
export function Dashboard({
  name,
  lifeScore,
  streak,
  modules,
  brief,
}: {
  name: string;
  lifeScore: number | null;
  streak: number;
  modules: DashModule[];
  brief: string;
}) {
  return (
    <div className="att-root">
      <div className="att-stage">
        <div className="att-brandbar">
          <span className="att-word">ATTIRA</span>
        </div>
        <PhoneFrame>
          <Screen bg="linear-gradient(168deg,#F4EEF7 0%,#F8F3EB 48%,#F2ECE1 100%)" blobs={BLOBS} gap={13}>
            {/* Header */}
            <div style={rise(0.05)}>
              <div className="att-eyebrow">Your ATTIRA</div>
              <div className="att-serif" style={{ fontSize: 29, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
                Good to see you, {name}
              </div>
            </div>

            {/* Life Score */}
            <div
              className="att-card"
              style={{ ...rise(0.13), borderRadius: 26, boxShadow: '0 12px 34px rgba(90,75,110,.1)', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 16 }}
            >
              <Ring
                value={lifeScore ?? 0}
                size={112}
                gradient={[
                  { offset: 0, color: '#B9A8D9' },
                  { offset: 0.6, color: '#C9A96A' },
                  { offset: 1, color: '#E0B7AF' },
                ]}
              >
                <div className="att-serif" style={{ fontSize: 40, fontWeight: 500, lineHeight: 1, color: '#40394A' }}>
                  {lifeScore ?? '—'}
                </div>
                <div style={{ fontSize: 8.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 600, marginTop: 2 }}>
                  Life score
                </div>
              </Ring>
              <div style={{ flex: 1 }}>
                <div className="att-serif" style={{ fontSize: 18, fontStyle: 'italic', color: '#5C5168', lineHeight: 1.3 }}>
                  {lifeScore == null ? 'Let’s find your baseline' : 'Everything, in one place'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--att-ink-soft)', lineHeight: 1.5, marginTop: 6 }}>
                  {lifeScore == null
                    ? 'Start a module below and your Life Score begins to take shape.'
                    : `The blend of your modules${streak ? ` · ${streak}-day streak` : ''}.`}
                </div>
              </div>
            </div>

            {/* Module cards */}
            {modules.map((m, i) => (
              <Link
                key={m.id}
                href={m.href}
                style={{
                  ...rise(0.2 + i * 0.06),
                  textDecoration: 'none',
                  color: 'inherit',
                  background: 'rgba(255,255,255,.75)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,.9)',
                  borderRadius: 22,
                  boxShadow: '0 8px 24px rgba(90,75,110,.07)',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    flex: 'none',
                    background: `radial-gradient(circle at 35% 30%,${m.swatch[0]},${m.swatch[1]})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-cormorant)',
                    fontSize: 18,
                    color: m.ink,
                  }}
                >
                  {m.tag}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="att-serif" style={{ fontSize: 20, color: '#40394A' }}>{m.name}</div>
                    {m.score != null && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8A713F', background: 'rgba(201,169,106,.14)', border: '1px solid rgba(201,169,106,.25)', padding: '2px 8px', borderRadius: 999 }}>
                        {m.score}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--att-ink-soft)', marginTop: 1 }}>{m.status}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F6F1FA', background: 'linear-gradient(135deg,#A995CF,#8A76B4)', padding: '8px 14px', borderRadius: 999 }}>
                  {m.cta} ›
                </span>
              </Link>
            ))}

            {/* Daily brief */}
            <div
              style={{
                ...rise(0.4),
                background: 'linear-gradient(135deg,rgba(85,137,141,.12),rgba(185,168,217,.12))',
                border: '1px solid rgba(85,137,141,.2)',
                borderRadius: 20,
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1, color: '#F6F1FA', background: '#55898D', padding: '3px 8px', borderRadius: 999, flex: 'none' }}>
                TODAY
              </span>
              <div style={{ fontSize: 12, color: '#4C5B5C', lineHeight: 1.5 }}>{brief}</div>
            </div>

            {/* Quiet links */}
            <div style={{ ...rise(0.46), display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
              <Link href="/memory" style={pill}>Your memory</Link>
              <Link href="/account" style={pill}>Settings</Link>
              <form action={signOut} style={{ marginLeft: 'auto' }}>
                <button type="submit" style={{ ...pill, background: 'transparent', border: '1px solid rgba(36,30,46,.15)', cursor: 'pointer', color: 'var(--att-muted)' }}>
                  Sign out
                </button>
              </form>
            </div>
          </Screen>
        </PhoneFrame>
      </div>
    </div>
  );
}

const rise = (d: number): React.CSSProperties => ({ animation: `attRise .7s ${d}s cubic-bezier(.2,.7,.2,1) both` });
const BLOBS: React.CSSProperties[] = [
  { top: -60, right: -70, width: 260, height: 260, background: 'radial-gradient(circle,rgba(196,178,226,.5),rgba(196,178,226,0) 70%)', filter: 'blur(30px)', animation: 'attFloat 9s ease-in-out infinite' },
  { bottom: 60, left: -80, width: 240, height: 240, background: 'radial-gradient(circle,rgba(231,198,192,.45),rgba(231,198,192,0) 70%)', filter: 'blur(30px)', animation: 'attFloat2 11s ease-in-out infinite' },
];
const pill: React.CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: '#5c5168',
  background: 'rgba(138,118,180,.1)',
  padding: '9px 15px',
  borderRadius: 999,
  textDecoration: 'none',
  fontFamily: 'inherit',
};
