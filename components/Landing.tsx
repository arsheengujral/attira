import Link from 'next/link';

/**
 * The front door — what a signed-out visitor sees at "/". Explains ATTIRA and
 * routes to sign up / sign in. Responsive (not phone-framed); palette-consistent.
 */
export function Landing() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        textAlign: 'center',
        background:
          'radial-gradient(ellipse 90% 60% at 20% 0%, #efe6f4, transparent 60%), radial-gradient(ellipse 80% 55% at 90% 100%, #f6eee2, transparent 55%), linear-gradient(160deg,#f4eef7 0%,#f1ece4 55%,#efe9ef 100%)',
        color: '#40394A',
        fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth: 620 }}>
        <div style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, letterSpacing: 8, color: '#5c5168', fontWeight: 500 }}>
          ATTIRA
        </div>
        <div style={{ fontSize: 10.5, letterSpacing: 2.6, textTransform: 'uppercase', color: '#9a8fa8', fontWeight: 600, marginTop: 10 }}>
          One companion · every part of you
        </div>

        <h1 className="att-serif" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 'clamp(34px, 6vw, 52px)', fontWeight: 500, lineHeight: 1.12, margin: '22px 0 0' }}>
          Your skin, your style,
          <br />
          getting stronger — together
        </h1>
        <p style={{ fontSize: 15.5, color: '#726C82', lineHeight: 1.7, maxWidth: 460, margin: '18px auto 0' }}>
          A calm, personal guide that learns you across every part of your life — and remembers.
          It starts with your skin and your style, and grows from there.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 30 }}>
          <Link
            href="/auth"
            style={{
              padding: '13px 30px',
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              color: '#f6f1fa',
              background: 'linear-gradient(135deg,#a995cf,#8a76b4)',
              boxShadow: '0 10px 26px rgba(138,118,180,.32)',
              textDecoration: 'none',
            }}
          >
            Get started
          </Link>
          <Link
            href="/auth"
            style={{
              padding: '13px 30px',
              borderRadius: 999,
              fontSize: 15,
              fontWeight: 600,
              color: '#5c5168',
              background: 'rgba(255,255,255,.7)',
              border: '1px solid rgba(138,118,180,.3)',
              textDecoration: 'none',
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Module teasers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 14, marginTop: 44 }}>
          <Teaser
            tag="Skin"
            title="A ritual that shows"
            body="Morning and night routines, monthly check-ins, an ingredient library, and visible progress over time."
          />
          <Teaser
            tag="Style"
            title="Made for you"
            body="Your colours, silhouettes, prints and more — a complete style profile from a few quick taps."
          />
        </div>

        <div style={{ fontSize: 12, color: '#9a8fa8', marginTop: 34, lineHeight: 1.6 }}>
          Private by design. Cosmetic guidance, never medical. We never train on your data.
        </div>
      </div>
    </div>
  );
}

function Teaser({ tag, title, body }: { tag: string; title: string; body: string }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,.7)',
        border: '1px solid rgba(255,255,255,.9)',
        borderRadius: 22,
        boxShadow: '0 10px 30px rgba(90,75,110,.08)',
        padding: '18px 20px',
        textAlign: 'left',
      }}
    >
      <div style={{ fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: '#8A76B4', fontWeight: 700 }}>{tag}</div>
      <div className="att-serif" style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 21, color: '#40394A', marginTop: 3 }}>{title}</div>
      <div style={{ fontSize: 12.5, color: '#726C82', lineHeight: 1.55, marginTop: 5 }}>{body}</div>
    </div>
  );
}
