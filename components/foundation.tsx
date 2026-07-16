/**
 * Presentational primitives for ATTIRA's foundation surfaces (auth, onboarding,
 * account, memory). Deliberately separate from the Skin design screens — these
 * are the plumbing pages, styled to sit calmly in the same ivory/lavender world.
 * No hooks here, so these compose inside Server Components + server actions.
 */

const INK = '#40394A';
const INK_SOFT = '#726C82';
const LAV = '#8A76B4';
const LINE = 'rgba(36,30,46,.12)';

export function PageShell({
  eyebrow,
  title,
  intro,
  children,
  footer,
  maxWidth = 460,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 18px',
        background:
          'radial-gradient(ellipse 80% 55% at 20% 0%, #efe6f4, transparent 60%), linear-gradient(160deg,#f4eef7 0%,#f1ece4 55%,#efe9ef 100%)',
        color: INK,
        fontFamily: 'var(--font-figtree), Figtree, system-ui, sans-serif',
      }}
    >
      <div style={{ width: '100%', maxWidth }}>
        <div style={{ textAlign: 'center', marginBottom: 22 }}>
          <div
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 22,
              letterSpacing: 6,
              color: '#5c5168',
              fontWeight: 500,
            }}
          >
            ATTIRA
          </div>
          {eyebrow && (
            <div
              style={{
                fontSize: 10.5,
                letterSpacing: 2.2,
                textTransform: 'uppercase',
                color: '#9a8fa8',
                fontWeight: 600,
                marginTop: 10,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            style={{
              fontFamily: 'var(--font-cormorant), serif',
              fontSize: 30,
              fontWeight: 500,
              margin: '4px 0 0',
              lineHeight: 1.15,
            }}
          >
            {title}
          </h1>
          {intro && (
            <p style={{ fontSize: 13.5, color: INK_SOFT, lineHeight: 1.6, marginTop: 10 }}>{intro}</p>
          )}
        </div>
        <div
          style={{
            background: 'rgba(255,255,255,.75)',
            backdropFilter: 'blur(14px)',
            border: '1px solid rgba(255,255,255,.9)',
            borderRadius: 24,
            boxShadow: '0 12px 34px rgba(90,75,110,.1)',
            padding: 24,
          }}
        >
          {children}
        </div>
        {footer && (
          <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: INK_SOFT }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 16 }}>
      <span
        style={{
          display: 'block',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: 1,
          textTransform: 'uppercase',
          color: INK_SOFT,
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 11.5, color: '#9a8fa8', marginTop: 5 }}>{hint}</span>}
    </label>
  );
}

const controlStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 13px',
  border: `1.5px solid ${LINE}`,
  borderRadius: 12,
  fontSize: 15,
  fontFamily: 'inherit',
  background: '#fff',
  color: INK,
  outline: 'none',
  boxSizing: 'border-box',
};

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...controlStyle, ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...controlStyle, ...props.style }} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} style={{ ...controlStyle, resize: 'vertical', lineHeight: 1.6, ...props.style }} />;
}

export function PrimaryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        width: '100%',
        padding: '13px',
        border: 'none',
        borderRadius: 999,
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: 14,
        fontWeight: 600,
        color: '#f6f1fa',
        background: 'linear-gradient(135deg,#a995cf,#8a76b4)',
        boxShadow: '0 8px 22px rgba(138,118,180,.32)',
        ...props.style,
      }}
    >
      {children}
    </button>
  );
}

export { INK, INK_SOFT, LAV, LINE };
