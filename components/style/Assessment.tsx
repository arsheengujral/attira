'use client';

import { useState } from 'react';
import { Screen } from '../shell';
import { FACE_SHAPES, PERSONAS, BODY_SHAPES_WOMEN, BODY_SHAPES_MEN } from '@/lib/style/knowledge';
import { computeStyleProfile, type StyleProfileInput, type StyleResult } from '@/lib/style/compute';

const BG = 'linear-gradient(168deg,#F1EBF6 0%,#F8F3EB 55%,#F2ECE1 100%)';
const rise = (d: number): React.CSSProperties => ({
  animation: `attRise .6s ${d}s cubic-bezier(.2,.7,.2,1) both`,
});

type Opt = { value: string; label: string; sub?: string };

const GENDER: Opt[] = [
  { value: 'woman', label: 'Womenswear' },
  { value: 'man', label: 'Menswear' },
  { value: 'unspecified', label: 'Either / fluid' },
];
const UNDERTONE: Opt[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'unsure', label: 'Not sure' },
];
const DEPTH: Opt[] = ['fair', 'light', 'medium', 'olive', 'deep'].map((v) => ({ value: v, label: cap(v) })).concat([{ value: 'unsure', label: 'Not sure' }]);
const FACE: Opt[] = (Object.keys(FACE_SHAPES) as (keyof typeof FACE_SHAPES)[])
  .map((k) => ({ value: k as string, label: FACE_SHAPES[k].name, sub: FACE_SHAPES[k].cue }))
  .concat([{ value: 'unsure', label: 'Not sure', sub: 'We’ll use the most universally flattering guidance.' }]);
const PERSONA: Opt[] = Object.values(PERSONAS).map((p) => ({ value: p.key as string, label: p.name, sub: p.blurb })).concat([{ value: 'unsure', label: 'Not sure', sub: 'We’ll start you at an easy, elevated everyday.' }]);
const COVERAGE: Opt[] = [
  { value: 'fully-covered', label: 'Fully covered' },
  { value: 'modest', label: 'Modest' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'open', label: 'Open' },
  { value: 'unsure', label: 'Not sure' },
];
const WORLD: Opt[] = [
  { value: 'western', label: 'Western' },
  { value: 'ethnic', label: 'Ethnic / traditional' },
  { value: 'fusion', label: 'Fusion' },
  { value: 'unsure', label: 'Not sure' },
];
const FIT: Opt[] = [
  { value: 'fitted', label: 'Fitted' },
  { value: 'tailored', label: 'Tailored' },
  { value: 'relaxed', label: 'Relaxed' },
  { value: 'oversized', label: 'Oversized' },
  { value: 'unsure', label: 'Not sure' },
];

function bodyOptions(gender?: string): Opt[] {
  const table = gender === 'man' ? BODY_SHAPES_MEN : BODY_SHAPES_WOMEN;
  return Object.entries(table)
    .map(([k, v]) => ({ value: k, label: v.name, sub: v.note }))
    .concat([{ value: 'unsure', label: 'Not sure', sub: 'We’ll use balanced, universally-flattering guidance.' }]);
}

export function Assessment({
  initial,
  onSubmit,
}: {
  initial?: Record<string, string>;
  onSubmit: (input: StyleProfileInput, result: StyleResult) => void;
}) {
  const [sel, setSel] = useState<Record<string, string>>({ ...(initial ?? {}) });
  const set = (id: string, value: string) => setSel((s) => ({ ...s, [id]: value }));

  function finish() {
    const input: StyleProfileInput = {
      gender: sel.gender as StyleProfileInput['gender'],
      undertone: sel.undertone as StyleProfileInput['undertone'],
      depth: sel.depth as StyleProfileInput['depth'],
      faceShape: sel.face_shape as StyleProfileInput['faceShape'],
      bodyShape: sel.body_shape,
      persona: sel.persona as StyleProfileInput['persona'],
      coverage: sel.coverage as StyleProfileInput['coverage'],
      world: sel.world as StyleProfileInput['world'],
      fit: sel.fit as StyleProfileInput['fit'],
      hasFacialHair: sel.gender === 'man',
    };
    onSubmit(input, computeStyleProfile(input));
  }

  return (
    <Screen
      bg={BG}
      blobs={[{ top: -50, right: -60, width: 240, height: 240, background: 'radial-gradient(circle,rgba(196,178,226,.4),rgba(196,178,226,0) 70%)', filter: 'blur(30px)', animation: 'attFloat 10s ease-in-out infinite' }]}
      pad="66px 18px 34px"
      gap={16}
    >
      <div style={rise(0.04)}>
        <div className="att-eyebrow">Style assessment</div>
        <div className="att-serif" style={{ fontSize: 29, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
          A few taps, and it’s yours
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--att-ink-soft)', lineHeight: 1.55, marginTop: 6 }}>
          Self-report only — no photos, no measurements. Not sure? Say so; every answer still gives a complete result.
        </div>
      </div>

      <Q id="gender" title="How do you dress?" opts={GENDER} sel={sel} set={set} delay={0.1} />
      <Q id="undertone" title="Your skin’s undertone" hint="Veins look greenish → warm; bluish → cool." opts={UNDERTONE} sel={sel} set={set} delay={0.14} />
      <Q id="depth" title="Your skin depth" opts={DEPTH} sel={sel} set={set} delay={0.18} />
      <Q id="face_shape" title="Which face shape feels closest?" opts={FACE} sel={sel} set={set} rich delay={0.22} />
      <Q id="body_shape" title="Which shape feels closest to yours?" hint="Dress to your shape — never to “correct” it." opts={bodyOptions(sel.gender)} sel={sel} set={set} rich delay={0.26} />
      <Q id="persona" title="Which feels most like your style?" opts={PERSONA} sel={sel} set={set} rich delay={0.3} />
      <Q id="coverage" title="Coverage you like" opts={COVERAGE} sel={sel} set={set} delay={0.34} />
      <Q id="world" title="Your comfort world" opts={WORLD} sel={sel} set={set} delay={0.38} />
      <Q id="fit" title="Fit you reach for" opts={FIT} sel={sel} set={set} delay={0.42} />

      <button onClick={finish} className="att-cta" style={{ ...rise(0.46), alignSelf: 'center', padding: '13px 30px', fontSize: 13.5 }}>
        See my style ›
      </button>
    </Screen>
  );
}

function Q({
  id, title, hint, opts, sel, set, rich, delay,
}: {
  id: string; title: string; hint?: string; opts: Opt[];
  sel: Record<string, string>; set: (id: string, v: string) => void; rich?: boolean; delay: number;
}) {
  const chosen = sel[id];
  return (
    <div style={rise(delay)}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#40394A' }}>{title}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--att-muted)', marginTop: 2 }}>{hint}</div>}
      <div style={{ display: rich ? 'flex' : 'flex', flexDirection: rich ? 'column' : 'row', flexWrap: rich ? 'nowrap' : 'wrap', gap: 8, marginTop: 9 }}>
        {opts.map((o) => {
          const on = chosen === o.value;
          return (
            <button
              key={o.value}
              onClick={() => set(id, o.value)}
              style={{
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                border: on ? '1.5px solid #8A76B4' : '1px solid rgba(138,118,180,.28)',
                background: on ? 'linear-gradient(135deg,rgba(169,149,207,.18),rgba(138,118,180,.12))' : 'rgba(255,255,255,.66)',
                borderRadius: rich ? 14 : 999,
                padding: rich ? '10px 13px' : '8px 14px',
                color: '#40394A',
                width: rich ? '100%' : undefined,
                boxShadow: on ? '0 4px 14px rgba(138,118,180,.2)' : undefined,
              }}
            >
              <div style={{ fontSize: rich ? 13 : 12.5, fontWeight: on ? 700 : 500 }}>{o.label}</div>
              {rich && o.sub && <div style={{ fontSize: 11, color: 'var(--att-ink-soft)', marginTop: 2, lineHeight: 1.4 }}>{o.sub}</div>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
