'use client';

import { createContext, useContext } from 'react';
import { DEMO_SKIN_DATA, type SkinData } from './data';

/**
 * Every Skin screen reads its data from here. AttiraApp wraps the tree in a
 * provider seeded with either the demo bundle or a signed-in user's real data;
 * the screens themselves don't know or care which.
 */
const SkinDataContext = createContext<SkinData>(DEMO_SKIN_DATA);

export function SkinDataProvider({ value, children }: { value: SkinData; children: React.ReactNode }) {
  return <SkinDataContext.Provider value={value}>{children}</SkinDataContext.Provider>;
}

export function useSkinData(): SkinData {
  return useContext(SkinDataContext);
}
