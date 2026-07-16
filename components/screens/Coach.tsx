'use client';

import { useState, useRef, useEffect } from 'react';
import { useSkinData } from '../skin-context';

interface Card {
  kind: 'answer' | 'ingredient' | 'referral';
  title?: string;
  body: string;
  ingredientId?: string;
  reasons?: string[];
  emergency?: boolean;
  from: 'you' | 'guide';
}

const OPENERS = ['Build me a simple routine', 'Is my skin purging?', 'What does niacinamide do?'];

/**
 * The Skin Coach. Responses render as rich cards (answer / ingredient / referral)
 * with quick-reply chips — never plain chat bubbles (spec: Skin Coach). Works
 * without login (memory empty) and without the model (safety + library still
 * answer). Referral hand-offs are calm and warm, never a red error.
 */
export function Coach({
  onBack,
  onOpenIngredient,
}: {
  onBack: () => void;
  onOpenIngredient: (id: string) => void;
}) {
  const data = useSkinData();
  const [cards, setCards] = useState<Card[]>([]);
  const [quick, setQuick] = useState<string[]>(OPENERS);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [cards, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setInput('');
    setCards((c) => [...c, { kind: 'answer', body: message, from: 'you' }]);
    setBusy(true);
    try {
      const history = cards
        .filter((c) => c.kind === 'answer')
        .map((c) => ({ role: c.from === 'you' ? ('user' as const) : ('assistant' as const), content: c.body }));
      const res = await fetch('/api/skin/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'The guide is unavailable.');
      const incoming: Card[] = (payload.cards ?? []).map((c: Omit<Card, 'from'>) => ({ ...c, from: 'guide' as const }));
      setCards((c) => [...c, ...incoming]);
      setQuick(payload.quickReplies ?? OPENERS);
    } catch (err) {
      setCards((c) => [...c, { kind: 'answer', body: err instanceof Error ? err.message : 'Something went wrong.', from: 'guide' }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(168deg,#F4EEF7 0%,#F8F3EB 55%,#F2ECE1 100%)', display: 'flex', flexDirection: 'column' }}>
      <button className="att-back" onClick={onBack} aria-label="Back">‹</button>

      <div style={{ padding: '62px 20px 8px', flex: 'none' }}>
        <div className="att-eyebrow">Your skin guide</div>
        <div className="att-serif" style={{ fontSize: 26, fontWeight: 500, marginTop: 2 }}>Ask me anything</div>
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 4px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cards.length === 0 && (
          <div style={{ fontSize: 12.5, color: 'var(--att-ink-soft)', lineHeight: 1.6, padding: '6px 2px' }}>
            Routines, ingredients, a product you’re unsure about, whether you’re purging — start with a tap below,
            or type your own. Guidance is cosmetic, never medical.
          </div>
        )}
        {cards.map((c, i) =>
          c.from === 'you' ? (
            <div key={i} style={{ alignSelf: 'flex-end', maxWidth: '85%', background: 'linear-gradient(135deg,#A995CF,#8A76B4)', color: '#F6F1FA', borderRadius: '16px 16px 4px 16px', padding: '9px 13px', fontSize: 12.5, lineHeight: 1.5 }}>
              {c.body}
            </div>
          ) : (
            <CoachCard key={i} card={c} ingredient={c.ingredientId ? data.ingredients.find((x) => x.id === c.ingredientId) : undefined} onOpenIngredient={onOpenIngredient} />
          ),
        )}
        {busy && (
          <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--att-muted)', fontStyle: 'italic', padding: '4px 2px', animation: 'attPulse 1.4s ease-in-out infinite' }}>
            thinking it through…
          </div>
        )}
      </div>

      {/* Quick replies */}
      <div style={{ flex: 'none', display: 'flex', gap: 7, overflowX: 'auto', padding: '6px 18px' }}>
        {quick.map((q) => (
          <button key={q} onClick={() => send(q)} disabled={busy} style={{ flex: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600, color: '#5c5168', background: 'rgba(255,255,255,.8)', border: '1px solid rgba(138,118,180,.3)', borderRadius: 999, padding: '7px 13px', whiteSpace: 'nowrap' }}>
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        style={{ flex: 'none', display: 'flex', gap: 8, padding: '8px 16px 18px', borderTop: '1px solid rgba(36,30,46,.08)' }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your guide…"
          style={{ flex: 1, padding: '11px 14px', borderRadius: 999, border: '1.5px solid rgba(138,118,180,.3)', background: '#fff', fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#40394A' }}
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#A995CF,#8A76B4)', color: '#F6F1FA', fontSize: 16, flex: 'none', opacity: busy || !input.trim() ? 0.5 : 1 }}>
          ↑
        </button>
      </form>
    </div>
  );
}

function CoachCard({
  card,
  ingredient,
  onOpenIngredient,
}: {
  card: Card;
  ingredient?: ReturnType<typeof useSkinData>['ingredients'][number];
  onOpenIngredient: (id: string) => void;
}) {
  if (card.kind === 'referral') {
    return (
      <div style={{ alignSelf: 'stretch', background: 'rgba(201,169,106,.12)', border: '1px solid rgba(201,169,106,.35)', borderRadius: 18, padding: '14px 16px' }}>
        <div style={{ fontSize: 9.5, letterSpacing: 1.4, textTransform: 'uppercase', color: '#A8863F', fontWeight: 700 }}>
          {card.title ?? 'Worth a professional look'}
        </div>
        <div style={{ fontSize: 12.5, color: '#5c5168', lineHeight: 1.6, marginTop: 6, whiteSpace: 'pre-wrap' }}>{card.body}</div>
      </div>
    );
  }
  if (card.kind === 'ingredient' && ingredient) {
    return (
      <button
        onClick={() => onOpenIngredient(ingredient.id)}
        style={{ alignSelf: 'stretch', textAlign: 'left', cursor: 'pointer', font: 'inherit', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.8)', border: '1px solid rgba(255,255,255,.95)', borderRadius: 18, padding: '12px 14px' }}
      >
        <div style={{ width: 42, height: 42, borderRadius: '50%', flex: 'none', background: `radial-gradient(circle at 35% 30%,${ingredient.swatch[0]},${ingredient.swatch[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-cormorant)', fontSize: 16, fontStyle: 'italic', color: ingredient.ink }}>
          {ingredient.monogram}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#40394A' }}>{ingredient.name}</div>
          <div style={{ fontSize: 11, color: 'var(--att-ink-soft)', lineHeight: 1.4 }}>{card.body}</div>
        </div>
        <span style={{ color: 'var(--att-lav)', fontSize: 13 }}>›</span>
      </button>
    );
  }
  return (
    <div style={{ alignSelf: 'stretch', background: 'rgba(255,255,255,.82)', border: '1px solid rgba(255,255,255,.95)', borderRadius: 18, padding: '12px 15px', fontSize: 12.5, color: '#40394A', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
      {card.body}
    </div>
  );
}
