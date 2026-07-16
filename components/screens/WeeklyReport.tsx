'use client';

import { useSkinData } from '../skin-context';
import { Screen } from '../shell';
import { HEAT_COLORS } from '../data';

const BG = 'linear-gradient(168deg,#F4EEF7 0%,#F8F3EB 48%,#F2ECE1 100%)';
const rise = (d: number): React.CSSProperties => ({
  animation: `attRise .7s ${d}s cubic-bezier(.2,.7,.2,1) both`,
});

/**
 * Weekly Skin Report (spec: "Drops Sunday"). A small, warm digest — score
 * movement, consistency, one ingredient highlight, one insight, one suggestion.
 * Always framed as a celebration of the week, even a quiet one.
 */
export function WeeklyReport({ onBack, onOpenCoach }: { onBack: () => void; onOpenCoach: () => void }) {
  const data = useSkinData();
  const highlight = data.ingredients.find((i) => i.mastery === 'New today') ?? data.ingredients[0];
  const days = data.consistency.slice(-7);
  const perfect = days.filter((n) => n >= 3).length;

  return (
    <>
      <button className="att-back" onClick={onBack} aria-label="Back">
        ‹
      </button>
      <Screen
        bg={BG}
        blobs={[
          { top: -50, right: -60, width: 240, height: 240, background: 'radial-gradient(circle,rgba(201,169,106,.28),rgba(201,169,106,0) 70%)', filter: 'blur(30px)', animation: 'attFloat 10s ease-in-out infinite' },
        ]}
        pad="66px 20px 34px"
        gap={13}
      >
        <div style={rise(0.05)}>
          <div className="att-eyebrow">Your week · Sunday report</div>
          <div className="att-serif" style={{ fontSize: 30, fontWeight: 500, marginTop: 2 }}>
            A quietly good week
          </div>
        </div>

        {/* Score movement */}
        <div className="att-card" style={{ ...rise(0.13), borderRadius: 22, padding: '15px 17px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div className="att-serif" style={{ fontSize: 40, fontWeight: 500, color: '#40394A', lineHeight: 1 }}>{data.score}</div>
            <div style={{ fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 600, marginTop: 3 }}>Skin score</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: '#55898D', background: 'rgba(85,137,141,.1)', border: '1px solid rgba(85,137,141,.18)', padding: '4px 10px', borderRadius: 999 }}>
              ▲ +{data.scoreTrend} this week
            </div>
            <div style={{ fontSize: 12, color: '#6E6579', lineHeight: 1.5, marginTop: 8 }}>
              Small and steady is exactly how skin actually changes — you’re right on pace.
            </div>
          </div>
        </div>

        {/* Consistency */}
        <div className="att-card" style={{ ...rise(0.2), borderRadius: 20, padding: '14px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#40394A' }}>Consistency</div>
            <div style={{ fontSize: 11, color: 'var(--att-muted)' }}>{perfect} of 7 days perfect</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5, marginTop: 9 }}>
            {days.map((n, i) => (
              <div key={i} style={{ height: 26, borderRadius: 7, background: HEAT_COLORS[n] }} />
            ))}
          </div>
        </div>

        {/* Ingredient highlight */}
        {highlight && (
          <div className="att-card" style={{ ...rise(0.27), borderRadius: 20, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 13 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: '50%',
                flex: 'none',
                background: `radial-gradient(circle at 35% 30%,${highlight.swatch[0]},${highlight.swatch[1]})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-cormorant)',
                fontSize: 17,
                fontStyle: 'italic',
                color: highlight.ink,
              }}
            >
              {highlight.monogram}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#55898D', fontWeight: 700 }}>Ingredient of the week</div>
              <div className="att-serif" style={{ fontSize: 18, color: '#40394A' }}>{highlight.name}</div>
              <div style={{ fontSize: 11.5, color: '#6E6579', lineHeight: 1.5, marginTop: 2 }}>{highlight.tagline}.</div>
            </div>
          </div>
        )}

        {/* Insight */}
        <div style={{ ...rise(0.34), background: 'linear-gradient(135deg,rgba(85,137,141,.12),rgba(185,168,217,.12))', border: '1px solid rgba(85,137,141,.2)', borderRadius: 20, padding: '13px 16px' }}>
          <div style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: '#55898D', fontWeight: 700 }}>What we noticed</div>
          <div style={{ fontSize: 12.5, color: '#4C5B5C', lineHeight: 1.55, marginTop: 6 }}>
            {data.insight ?? 'Your barrier has stayed calm all week — the surest sign the basics are working.'}
          </div>
        </div>

        {/* Suggestion */}
        <div style={{ ...rise(0.4), background: 'rgba(201,169,106,.1)', border: '1px solid rgba(201,169,106,.22)', borderRadius: 20, padding: '13px 16px' }}>
          <div style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: '#A8863F', fontWeight: 700 }}>For the week ahead</div>
          <div style={{ fontSize: 12.5, color: '#6B5D44', lineHeight: 1.55, marginTop: 6 }}>
            One small thing: add a midday mist on the days your skin feels tight by evening. That’s the whole plan.
          </div>
        </div>

        <button onClick={onOpenCoach} className="att-cta" style={{ alignSelf: 'center', padding: '11px 24px', fontSize: 12.5, marginTop: 2 }}>
          Ask about this week ›
        </button>
      </Screen>
    </>
  );
}
