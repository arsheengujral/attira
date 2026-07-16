import 'server-only';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * The Skin knowledge scaffold (docs/scaffold-skin.md) is the coach's system
 * prompt (§29 rules + the full ingredient/protocol knowledge). Read once and
 * cached. If the file isn't readable in a given deployment, callers fall back to
 * the embedded §29 rules so coaching still behaves safely.
 */
let cached: string | null = null;

export async function getSkinScaffold(): Promise<string> {
  if (cached !== null) return cached;
  try {
    cached = await readFile(path.join(process.cwd(), 'docs', 'scaffold-skin.md'), 'utf8');
  } catch {
    cached = '';
  }
  return cached;
}
