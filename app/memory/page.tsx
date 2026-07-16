import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { listFacts, listEpisodes, listPatterns, listConsent } from '@/lib/memory/server';
import { deleteMemoryRow, deleteAllMemory, setConsent } from './actions';
import { PageShell, INK, INK_SOFT, LAV } from '@/components/foundation';

export const dynamic = 'force-dynamic';

const CONSENT_CATEGORIES = ['health', 'relationships', 'finances'];

export default async function MemoryPage() {
  const supabase = createServerSupabase();
  if (!supabase) redirect('/auth');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/memory');

  const [facts, episodes, patterns, consent] = await Promise.all([
    listFacts(user.id),
    listEpisodes(user.id),
    listPatterns(user.id),
    listConsent(user.id),
  ]);
  const consentMap = new Map(consent.map((c) => [c.category, c.granted]));

  return (
    <PageShell
      eyebrow="Yours to control"
      title="Your memory"
      intro="This is everything ATTIRA remembers, and it’s the whole point — the more it knows, the more it can help. You can view, export, or delete any of it. We never train on your data."
      maxWidth={640}
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 22, flexWrap: 'wrap' }}>
        <Link href="/account" style={pill}>← Account</Link>
        <a href="/api/memory/export" style={pill}>Export everything (JSON)</a>
        <form action={deleteAllMemory} style={{ marginLeft: 'auto' }}>
          <button type="submit" style={{ ...pill, background: 'transparent', border: '1px solid rgba(217,138,147,.5)', color: '#b06b74', cursor: 'pointer' }}>
            Delete all memory
          </button>
        </form>
      </div>

      {/* Consent */}
      <Section title="Sensitive categories" sub="We ask before storing anything in these. Off means we don’t keep it.">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CONSENT_CATEGORIES.map((cat) => {
            const granted = consentMap.get(cat) ?? false;
            return (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(36,30,46,.07)' }}>
                <span style={{ fontSize: 13.5, color: INK, textTransform: 'capitalize' }}>{cat}</span>
                <form action={setConsent}>
                  <input type="hidden" name="category" value={cat} />
                  <input type="hidden" name="granted" value={(!granted).toString()} />
                  <button type="submit" style={{ ...toggle, background: granted ? '#7fa8ab' : 'rgba(36,30,46,.15)' }} aria-pressed={granted}>
                    <span style={{ ...knob, transform: granted ? 'translateX(18px)' : 'translateX(0)' }} />
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Facts */}
      <Section title={`Facts (${facts.length})`} sub="Stable attributes.">
        {facts.length === 0 ? (
          <Empty>Nothing yet — complete your profile and your rituals, and facts start to gather here.</Empty>
        ) : (
          facts.map((f) => (
            <Row key={f.id} table="memory_facts" id={f.id}>
              <span style={{ fontWeight: 600 }}>{f.key.replace(/_/g, ' ')}</span>
              <span style={{ color: INK_SOFT }}> · {f.value}</span>
              {f.sensitive && <Tag>sensitive</Tag>}
              {f.source_module && <Tag muted>{f.source_module}</Tag>}
            </Row>
          ))
        )}
      </Section>

      {/* Patterns */}
      <Section title={`Patterns (${patterns.length})`} sub="Derived insights — written by the nightly reflection.">
        {patterns.length === 0 ? (
          <Empty>No patterns yet. These appear once there’s a little history to reflect on.</Empty>
        ) : (
          patterns.map((p) => (
            <Row key={p.id} table="memory_patterns" id={p.id}>
              {p.insight}
              <Tag muted>{Math.round(p.confidence * 100)}%</Tag>
            </Row>
          ))
        )}
      </Section>

      {/* Episodes */}
      <Section title={`Episodes (${episodes.length})`} sub="Timestamped events.">
        {episodes.length === 0 ? (
          <Empty>No episodes yet — check-ins, rituals and notes will show up here as they happen.</Empty>
        ) : (
          episodes.map((e) => (
            <Row key={e.id} table="memory_episodes" id={e.id}>
              <span style={{ color: INK_SOFT, fontSize: 11 }}>{new Date(e.occurred_at).toLocaleDateString()} · </span>
              {e.content}
              {e.module && <Tag muted>{e.module}</Tag>}
            </Row>
          ))
        )}
      </Section>
    </PageShell>
  );
}

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: INK_SOFT, fontWeight: 700 }}>{title}</div>
      {sub && <div style={{ fontSize: 12, color: '#9a8fa8', margin: '3px 0 10px' }}>{sub}</div>}
      {children}
    </div>
  );
}

function Row({ table, id, children }: { table: string; id: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(36,30,46,.07)', fontSize: 13, color: INK, lineHeight: 1.5 }}>
      <div style={{ flex: 1 }}>{children}</div>
      <form action={deleteMemoryRow}>
        <input type="hidden" name="table" value={table} />
        <input type="hidden" name="id" value={id} />
        <button type="submit" title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0a7bc', fontSize: 15, lineHeight: 1, padding: 2 }}>
          ×
        </button>
      </form>
    </div>
  );
}

function Tag({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: muted ? '#9a8fa8' : '#8a6d2f',
        background: muted ? 'rgba(154,143,168,.14)' : 'rgba(201,169,106,.16)',
        padding: '2px 7px',
        borderRadius: 999,
        marginLeft: 7,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12.5, color: '#9a8fa8', lineHeight: 1.55, padding: '4px 0' }}>{children}</div>;
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
const toggle: React.CSSProperties = {
  width: 42,
  height: 24,
  borderRadius: 999,
  border: 'none',
  cursor: 'pointer',
  position: 'relative',
  padding: 0,
  transition: 'background .2s',
};
const knob: React.CSSProperties = {
  position: 'absolute',
  top: 3,
  left: 3,
  width: 18,
  height: 18,
  borderRadius: '50%',
  background: '#fff',
  transition: 'transform .2s',
};
