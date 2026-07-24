'use client';

import { Screen } from '../shell';
import type { StyleResult } from '@/lib/style/compute';

const BG = 'linear-gradient(168deg,#F4EEF7 0%,#F8F3EB 48%,#F2ECE1 100%)';
const rise = (d: number): React.CSSProperties => ({
  animation: `attRise .7s ${d}s cubic-bezier(.2,.7,.2,1) both`,
});

/**
 * The Style Profile result — the six structured outputs (+ hair/makeup), in the
 * shared ivory/lavender card language. Every block always renders (spec Global
 * Rule 2). Reuses the Skin design system directly (Option A), no new design.
 */
export function StyleResultView({
  result,
  onRetake,
  changed,
}: {
  result: StyleResult;
  onRetake: () => void;
  changed?: string[];
}) {
  return (
    <Screen
      bg={BG}
      blobs={[
        { top: -60, right: -70, width: 260, height: 260, background: 'radial-gradient(circle,rgba(196,178,226,.45),rgba(196,178,226,0) 70%)', filter: 'blur(30px)', animation: 'attFloat 10s ease-in-out infinite' },
        { bottom: 40, left: -80, width: 240, height: 240, background: 'radial-gradient(circle,rgba(231,198,192,.4),rgba(231,198,192,0) 70%)', filter: 'blur(30px)', animation: 'attFloat2 11s ease-in-out infinite' },
      ]}
      pad="66px 18px 36px"
      gap={12}
    >
      {/* Header */}
      <div style={rise(0.05)}>
        <div className="att-eyebrow">Your style profile</div>
        <div className="att-serif" style={{ fontSize: 29, fontWeight: 500, lineHeight: 1.1, marginTop: 2 }}>
          Made for you
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--att-ink-soft)', marginTop: 4 }}>
          {result.seasonName} · {result.personaName}
        </div>
      </div>

      {/* what changed diff */}
      {changed && changed.length > 0 && (
        <div style={{ ...rise(0.1), background: 'linear-gradient(135deg,rgba(85,137,141,.12),rgba(185,168,217,.12))', border: '1px solid rgba(85,137,141,.2)', borderRadius: 16, padding: '10px 14px', fontSize: 11.5, color: '#4C5B5C', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: '#2E5558' }}>Updated:</span> {changed.join(' · ')}
        </div>
      )}

      {/* 1 · Colours */}
      <Block n={1} label="Your colours" delay={0.14}>
        <div style={{ display: 'flex', gap: 9, marginTop: 4, marginBottom: 10 }}>
          {result.colours.palette.map((hex) => (
            <div key={hex} style={{ flex: 1, aspectRatio: '1', borderRadius: '50%', background: hex, border: '1.5px solid rgba(255,255,255,.9)', boxShadow: '0 3px 10px rgba(90,75,110,.12)' }} title={hex} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#5C5168', lineHeight: 1.5 }}>{result.colours.description}</div>
        <Line label="Metals" value={result.colours.metals} />
        <Line label="Ease off" value={result.colours.ease} />
      </Block>

      {/* 2 · Necklines & Frames */}
      <Block n={2} label="Necklines & frames" delay={0.2}>
        <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'var(--att-muted)', marginBottom: 6 }}>{result.faceName} · {result.neckFrames.cue}</div>
        <Line label="Necklines" value={result.neckFrames.necklines} />
        <Line label="Eyewear" value={result.neckFrames.eyewear} />
        <Line label="Hair direction" value={result.neckFrames.hair} />
      </Block>

      {/* 3 · Silhouettes & Fabrics */}
      <Block n={3} label="Silhouettes & fabrics" delay={0.26}>
        <div style={{ fontSize: 11.5, fontStyle: 'italic', color: 'var(--att-muted)', marginBottom: 6 }}>{result.silhouettes.name}</div>
        <Line label="Silhouettes" value={result.silhouettes.silhouettes} />
        <Line label="Fabrics" value={result.silhouettes.fabrics} />
        <Line label="Keep in mind" value={result.silhouettes.note} />
      </Block>

      {/* 4 · Prints */}
      <Block n={4} label="Prints" delay={0.32}>
        <div style={{ fontSize: 12.5, color: '#5C5168', lineHeight: 1.55 }}>{result.prints}</div>
      </Block>

      {/* 5 · Footwear */}
      <Block n={5} label="Footwear" delay={0.38}>
        <div style={{ fontSize: 12.5, color: '#5C5168', lineHeight: 1.55 }}>{result.footwear}</div>
      </Block>

      {/* 6 · Jewellery & Accessories */}
      <Block n={6} label="Jewellery & accessories" delay={0.44}>
        <Line label="Pieces" value={result.jewellery.pieces} />
        <Line label="Watch" value={result.jewellery.watch} />
      </Block>

      {/* + Hair & Makeup (styling only) */}
      <div style={{ ...rise(0.5), background: 'linear-gradient(135deg,rgba(201,169,106,.1),rgba(233,207,164,.16))', border: '1px solid rgba(201,169,106,.26)', borderRadius: 22, padding: '14px 16px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: '#A8863F', fontWeight: 700 }}>Hair & makeup · styling</div>
        <div style={{ marginTop: 6 }}>
          <Line label="Hair" value={result.hairMakeup.hair} />
          <Line label="Makeup" value={result.hairMakeup.makeup} />
          {result.hairMakeup.beard && <Line label="Beard" value={result.hairMakeup.beard} />}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--att-muted)', marginTop: 8, lineHeight: 1.5 }}>
          Styling only — for hair care (fall, dandruff, routine), the Hair Coach is the place.
        </div>
      </div>

      {/* Framing (coverage/world/fit) */}
      <div style={{ ...rise(0.56), fontSize: 11, color: 'var(--att-muted)', textAlign: 'center', lineHeight: 1.6, padding: '0 6px' }}>
        {result.flavour.world} {result.flavour.coverage} {result.flavour.fit}
      </div>

      <button onClick={onRetake} className="att-cta" style={{ alignSelf: 'center', padding: '11px 24px', fontSize: 12.5, marginTop: 2 }}>
        Retake the assessment
      </button>
    </Screen>
  );
}

function Block({ n, label, delay, children }: { n: number; label: string; delay: number; children: React.ReactNode }) {
  return (
    <div className="att-card" style={{ ...rise(delay), borderRadius: 22, padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
        <span style={{ width: 22, height: 22, borderRadius: '50%', flex: 'none', background: 'linear-gradient(140deg,#CFC2E6,#A995CF)', color: '#F6F1FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cormorant)', fontSize: 12 }}>{n}</span>
        <span style={{ fontSize: 9.5, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 700 }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '3px 0', fontSize: 12, lineHeight: 1.5 }}>
      <span style={{ flex: 'none', width: 78, fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase', color: 'var(--att-muted)', fontWeight: 700, paddingTop: 1 }}>{label}</span>
      <span style={{ color: '#4A4353' }}>{value}</span>
    </div>
  );
}
