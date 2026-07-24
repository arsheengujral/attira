import type { Module } from './types';
import { skinModule } from './skin';
import { styleModule } from './style';

/**
 * The module registry. Every domain plugs in here; the shell renders any
 * registered module the same way. Registering a new domain is one line.
 */
const REGISTRY = new Map<string, Module>();

export function registerModule(mod: Module) {
  REGISTRY.set(mod.id, mod);
}

export function getModule(id: string): Module | undefined {
  return REGISTRY.get(id);
}

export function listModules(): Module[] {
  return Array.from(REGISTRY.values());
}

// ── Registered modules ──────────────────────────────────────────────────────
registerModule(skinModule);
registerModule(styleModule);
