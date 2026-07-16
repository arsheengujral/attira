/**
 * The module contract (CLAUDE.md Part 1). Every life domain implements the same
 * skeleton — Assess → Profile → Plan → Track → Coach — so the dashboard, Life
 * Score, streaks and reports work for any domain automatically. Adding a domain
 * later is a config file, not a rebuild.
 */

import type { RetrievedContext } from '@/lib/memory/types';

export type Tier = 'free' | 'premium' | 'plus';

export interface Question {
  id: string;
  label: string;
  type: 'single' | 'multi' | 'scale' | 'text';
  options?: string[];
  required?: boolean;
  help?: string;
}

export type Answers = Record<string, string | string[] | number | undefined>;

/** Structured intake result — written to module_profiles.data + memory. */
export type Profile = Record<string, unknown>;

export interface PlanItem {
  day?: number;
  title: string;
  detail?: string;
}
export interface Plan {
  horizon: string; // e.g. '30day'
  items: PlanItem[];
}

export interface Metric {
  key: string;
  label: string;
  unit?: string;
}

/** The system prompt a module hands the model, with memory folded in. */
export interface Prompt {
  system: string;
}

export interface CoachContext {
  query: string;
  memory: RetrievedContext;
  profile?: Profile;
}

/** Inputs to the 0–100 domain score (feeds the aggregate Life Score). */
export interface ScoreInput {
  profile?: Profile;
  progress?: Record<string, number>;
}

export interface Module {
  id: string; // 'skin' | 'style' | 'career' | 'english' ...
  name: string;
  icon: string;
  tier: Tier;

  assess(): Question[];
  profile(answers: Answers): Profile;
  plan(profile: Profile): Plan;
  track(): Metric[];
  coach(context: CoachContext): Prompt;
  score(input: ScoreInput): number;
}
