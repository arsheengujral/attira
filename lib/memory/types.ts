/** Memory Engine — the three tiers of memory (CLAUDE.md Part 2). */

export interface Fact {
  id: string;
  key: string;
  value: string | null;
  confidence: number;
  source_module: string | null;
  sensitive: boolean;
  updated_at: string;
}

export interface Episode {
  id: string;
  module: string | null;
  type: string | null;
  content: string;
  occurred_at: string;
}

export interface Pattern {
  id: string;
  insight: string;
  evidence_ids: string[];
  confidence: number;
  generated_at: string;
}

export interface Consent {
  category: string;
  granted: boolean;
  updated_at: string;
}

/** What a module receives for a query — selective, not the whole memory. */
export interface RetrievedContext {
  facts: Fact[];
  moduleProfile: Record<string, unknown> | null;
  episodes: Episode[];
  patterns: Pattern[];
}
