'use client';

import { useState } from 'react';
import type { AnalyzerResult, FlagKind } from '@/lib/skin/analyze';

const BG = 'linear-gradient(168deg,#F1EBF6 0%,#F8F3EB 55%,#F2ECE1 100%)';
const rise = (d: number): React.CSSProperties => ({
  animation: `attRise .6s ${d}s cubic-bezier(.2,.7,.2,1) both`,
});

const FLAG_STYLE: Record<FlagKind, { bg: string; ink: string; label: string }> = {
  irritant: { bg: 'rgba(224,183,175,.18)', ink: '#9a5148', label: 'Irritant' },
  allergen: { bg: 'rgba(217,138,147,.2)', ink: '#8f3f4c', label: 'Allergen' },
  conflict: { bg: 'rgba(201,169,106,.18)', ink: '#8a6d2f', label: 'Conflict' },
  comedogenic: { bg: 'rgba(201,169,106,.14)', ink: '#8a6d2f', label: 'Comedogenic' },
  'fungal-acne': { bg: 'rgba(138,118,180,.14)', ink: '#6e5c96', label: 'Fungal-acne' },
};

const VERDICT_STYLE = {
  keep: { bg: 'rgba(85,137,141,.12)', border: 'rgba(85,137,141,.3)', ink: '#2e5558', label: 'Keep' },
  adjust: { bg: 'rgba(201,169,106,.14)', border: 'rgba(201,169,106,.32)', ink: '#8a6d2f', label: 'Keep, but adjust' },
  reconsider: { bg: 'rgba(224,183,175,.16)', border: 'rgba(224,183,175,.4)', ink: '#9a5148', label: 'Reconsider' },
};

/**
 * Product Scanner results (§12), built in the Ingredient-page visual language.
 * Paste an INCI list → what it's for, key actives, a match score, flags,
 * redundancy, and a clear verdict with a reason. Brand-neutral throughout.
 */
export function ProductScanner({ onBack }: { onBack: () => void }) {
  const [inci, setInci] = useState('');
  const [result, setResult] = useState<AnalyzerResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyze() {
    if (!inci.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/skin/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inci }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not read that.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: BG }}>
      <button className="att-back" onClick={onBack} aria-label="Back">‹</button>
      <div className="att-canvas" style={{ padding: '66px 20px 34px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div style={rise(0.04)}>
          <div className="att-eyebrow">Scan a product</div>
          <div className="att-serif" style={{ fontSize: 28, fontWeight: 500, marginTop: 2 }}>Read the label</div>
          <div style={{ fontSize: 12.5, color: 'var(--att-ink-soft)', lineHeight: 1.55, marginTop: 6 }}>
            Paste the ingredients (INCI) list. We’ll read the formula, never the brand.
          </div>
        </div>

        <textarea
          value={inci}
          onChange={(e) => setInci(e.target.value)}
          placeholder="Aqua, Niacinamide, Glycerin, Zinc PCA, Fragrance…"
          rows={4}
          style={{ ...rise(0.1), width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 16, border: '1.5px solid rgba(138,118,180,.3)', background: '#fff', fontSize: 13.5, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none', color: '#40394A' }}
        />
        {error && <div style={{ fontSize: 12, color: '#9a5148' }}>{error}</div>}
        <button onClick={analyze} disabled={busy || !inci.trim()} className="att-cta" style={{ alignSelf: 'flex-start', padding: '11px 24px', fontSize: 13, opacity: busy || !inci.trim() ? 0.5 : 1 }}>
          {busy ? 'Reading…' : 'Analyze'}
        </button>

        {result && <Result result={result} />}
      </div>
    </div>
  );
}

function Result({ result }: { result: AnalyzerResult }) {
  const v = VERDICT_STYLE[result.verdict];
  return (
    <div style={{ ...rise(0.05), display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
      {/* Category + match score */}
      <div className="att-card" style={{ borderRadius: 20, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 700 }}>What this is</div>
          <div className="att-serif" style={{ fontSize: 20, color: '#40394A', marginTop: 2 }}>{result.category}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="att-serif" style={{ fontSize: 30, color: '#40394A', lineHeight: 1 }}>{result.matchScore}</div>
          <div style={{ fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 600 }}>Match</div>
        </div>
      </div>

      {/* Key actives */}
      {result.keyActives.length > 0 && (
        <div className="att-card" style={{ borderRadius: 20, padding: '13px 16px' }}>
          <div style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 700, marginBottom: 8 }}>Key actives</div>
          {result.keyActives.map((a) => (
            <div key={a.name} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 12.5, color: '#40394A' }}>
              <span style={{ fontWeight: 700 }}>{a.name}</span>
              <span style={{ color: 'var(--att-ink-soft)' }}>— {a.role}</span>
            </div>
          ))}
        </div>
      )}

      {/* Flags */}
      {result.flags.length > 0 && (
        <div className="att-card" style={{ borderRadius: 20, padding: '13px 16px' }}>
          <div style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 700, marginBottom: 8 }}>Worth knowing</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {result.flags.map((f, i) => {
              const s = FLAG_STYLE[f.kind];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, fontSize: 12, color: '#5c5168', lineHeight: 1.45 }}>
                  <span style={{ flex: 'none', fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: s.ink, background: s.bg, padding: '3px 8px', borderRadius: 999 }}>{s.label}</span>
                  <span><strong style={{ color: '#40394A' }}>{f.ingredient}</strong> — {f.note}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Redundancy */}
      {result.redundancy.length > 0 && (
        <div style={{ background: 'rgba(138,118,180,.08)', border: '1px solid rgba(138,118,180,.2)', borderRadius: 18, padding: '12px 15px' }}>
          {result.redundancy.map((r, i) => (
            <div key={i} style={{ fontSize: 12, color: '#5c5168', lineHeight: 1.5 }}>{r}</div>
          ))}
        </div>
      )}

      {/* Verdict */}
      <div style={{ background: v.bg, border: `1px solid ${v.border}`, borderRadius: 20, padding: '14px 16px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: v.ink, fontWeight: 700 }}>Verdict · {v.label}</div>
        <div style={{ fontSize: 13, color: '#40394A', lineHeight: 1.55, marginTop: 6 }}>{result.reason}</div>
      </div>
    </div>
  );
}
