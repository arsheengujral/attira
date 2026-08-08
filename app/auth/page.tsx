'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageShell, Field, TextInput, PrimaryButton, LAV } from '@/components/foundation';

function AuthInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/home';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const configured = Boolean(supabase);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError('Accounts aren’t configured yet. Add your Supabase keys to .env.local — see the README.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          if (data.code === 'exists') setMode('signin');
          throw new Error(data.error || 'Could not create your account.');
        }
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw new Error(signInError.message);
      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell
      eyebrow="Welcome"
      title={mode === 'signin' ? 'Sign in' : 'Create your account'}
      intro={
        mode === 'signin'
          ? 'Your rituals, your history, your progress — all waiting where you left them.'
          : 'One account. Your skin story starts here — and it compounds from day one.'
      }
      footer={
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: LAV, fontWeight: 600, fontSize: 13, fontFamily: 'inherit' }}
        >
          {mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}
        </button>
      }
    >
      {!configured && (
        <div
          style={{
            fontSize: 12.5,
            color: '#8a6d2f',
            background: 'rgba(201,169,106,.12)',
            border: '1px solid rgba(201,169,106,.3)',
            borderRadius: 12,
            padding: '10px 13px',
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Accounts aren’t configured on this instance yet. Add <code>NEXT_PUBLIC_SUPABASE_URL</code>,{' '}
          <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
          <code>.env.local</code> (see the README), then restart.
        </div>
      )}
      <form onSubmit={submit}>
        <Field label="Email">
          <TextInput
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password" hint={mode === 'signup' ? 'At least 6 characters.' : undefined}>
          <TextInput
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        {error && (
          <div style={{ fontSize: 12.5, color: '#9a5148', marginBottom: 12, lineHeight: 1.5 }}>{error}</div>
        )}
        <PrimaryButton type="submit" disabled={busy} style={busy ? { opacity: 0.6 } : undefined}>
          {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </PrimaryButton>
      </form>
    </PageShell>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthInner />
    </Suspense>
  );
}
