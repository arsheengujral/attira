import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { saveProfile } from '@/lib/actions';
import { PageShell, Field, TextInput, Select, PrimaryButton, INK_SOFT } from '@/components/foundation';

export const dynamic = 'force-dynamic';

const AGE_BANDS = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'];
const GENDERS = ['Woman', 'Man', 'Non-binary', 'Prefer not to say'];
const CLIMATES = ['Hot & dry', 'Hot & humid', 'Temperate', 'Cold & dry', 'Monsoon / variable'];
const LIFESTYLES = ['Mostly indoors', 'Mixed', 'Mostly outdoors', 'High travel'];
const BUDGETS = ['Essential', 'Mid-range', 'Premium'];
const RELATIONSHIPS = ['Single', 'Dating', 'Partnered', 'Married', 'Prefer not to say'];
const GOALS = ['Clearer skin', 'More hydration', 'Even tone', 'Fewer fine lines', 'A calmer barrier', 'A simple routine'];

export default async function OnboardingPage() {
  const supabase = createServerSupabase();
  if (!supabase) {
    return (
      <PageShell eyebrow="Setup needed" title="Accounts aren’t configured yet">
        <p style={{ fontSize: 13.5, color: INK_SOFT, lineHeight: 1.6 }}>
          Add your Supabase keys to <code>.env.local</code> and restart — see the README. Then sign in and this
          form will save your profile.
        </p>
      </PageShell>
    );
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth?next=/onboarding');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const p = profile ?? {};
  const goals: string[] = Array.isArray(p.goals) ? p.goals : [];

  return (
    <PageShell
      eyebrow="A little about you"
      title="Set up your profile"
      intro="This is what your rituals adapt to — climate, comfort, and what you’re working toward. Nothing here is a medical record; you can edit or delete any of it later."
      maxWidth={520}
    >
      <form action={saveProfile}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Age band">
            <Select name="age_band" defaultValue={p.age_band ?? ''}>
              <option value="">Select…</option>
              {AGE_BANDS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Gender" hint="Shapes grooming steps (e.g. shave-day).">
            <Select name="gender" defaultValue={p.gender ?? ''}>
              <option value="">Select…</option>
              {GENDERS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="City">
            <TextInput name="city" defaultValue={p.city ?? ''} placeholder="e.g. Delhi" />
          </Field>
          <Field label="Country">
            <TextInput name="country" defaultValue={p.country ?? ''} placeholder="e.g. India" />
          </Field>
          <Field label="Climate">
            <Select name="climate" defaultValue={p.climate ?? ''}>
              <option value="">Select…</option>
              {CLIMATES.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Lifestyle">
            <Select name="lifestyle" defaultValue={p.lifestyle ?? ''}>
              <option value="">Select…</option>
              {LIFESTYLES.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </Select>
          </Field>
          <Field label="Occupation">
            <TextInput name="occupation" defaultValue={p.occupation ?? ''} placeholder="e.g. Designer" />
          </Field>
          <Field label="Budget" hint="Kept private.">
            <Select name="budget_band" defaultValue={p.budget_band ?? ''}>
              <option value="">Select…</option>
              {BUDGETS.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Relationship status" hint="Optional, and kept private.">
          <Select name="relationship_status" defaultValue={p.relationship_status ?? ''}>
            <option value="">Prefer not to say</option>
            {RELATIONSHIPS.map((x) => (
              <option key={x} value={x}>{x}</option>
            ))}
          </Select>
        </Field>

        <Field label="What you’re working toward">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
            {GOALS.map((g) => {
              const on = goals.includes(g);
              return (
                <label
                  key={g}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 12.5,
                    padding: '7px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(138,118,180,.3)',
                    background: 'rgba(138,118,180,.06)',
                    cursor: 'pointer',
                  }}
                >
                  <input type="checkbox" name="goals" value={g} defaultChecked={on} />
                  {g}
                </label>
              );
            })}
          </div>
        </Field>

        <PrimaryButton type="submit" style={{ marginTop: 6 }}>
          Save profile
        </PrimaryButton>
      </form>
    </PageShell>
  );
}
