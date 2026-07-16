'use client';

import { useState } from 'react';
import type { TabId, SkinData } from './data';
import { DEMO_SKIN_DATA } from './data';
import { SkinDataProvider } from './skin-context';
import { PhoneFrame, BottomNav } from './shell';
import { Today } from './screens/Today';
import { CheckIn, CheckInFlow } from './screens/CheckIn';
import { Rituals } from './screens/Rituals';
import { Learn } from './screens/Learn';
import { You } from './screens/You';
import { RitualScreen } from './screens/RitualScreen';
import { DayComplete } from './screens/DayComplete';
import { Journey } from './screens/Journey';
import { IngredientDetail } from './screens/IngredientDetail';
import { WeeklyReport } from './screens/WeeklyReport';
import { Coach } from './screens/Coach';
import { ProductScanner } from './screens/ProductScanner';
import { completeRitual, logCheckIn } from '@/lib/skin/actions';

type Overlay =
  | null
  | { kind: 'checkin' }
  | { kind: 'ritual'; which: 'am' | 'pm' }
  | { kind: 'daycomplete' }
  | { kind: 'journey' }
  | { kind: 'ingredient'; id: string }
  | { kind: 'weekly' }
  | { kind: 'coach' }
  | { kind: 'scanner' };

// Fire-and-forget write-backs. No-op in the demo (no session); errors are swallowed
// so the UI flow never blocks on the network. (Untested pending a live DB.)
function fire(p: Promise<unknown>) {
  void p.catch(() => {});
}

export default function AttiraApp({ data }: { data?: SkinData }) {
  const d = data ?? DEMO_SKIN_DATA;
  const [tab, setTab] = useState<TabId>('today');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [streak, setStreak] = useState(d.streak);
  const [nightDone, setNightDone] = useState(d.pmDone);

  const go = (t: TabId) => {
    setOverlay(null);
    setTab(t);
  };

  const screen = () => {
    switch (tab) {
      case 'today':
        return (
          <Today
            streak={streak}
            nightDone={nightDone}
            onBeginNight={() => setOverlay({ kind: 'ritual', which: 'pm' })}
            onOpenWeekly={() => setOverlay({ kind: 'weekly' })}
            onOpenCoach={() => setOverlay({ kind: 'coach' })}
            onGo={go}
          />
        );
      case 'checkin':
        return <CheckIn onBegin={() => setOverlay({ kind: 'checkin' })} />;
      case 'rituals':
        return <Rituals nightDone={nightDone} onOpen={(which) => setOverlay({ kind: 'ritual', which })} />;
      case 'learn':
        return (
          <Learn
            onOpen={(id) => setOverlay({ kind: 'ingredient', id })}
            onOpenScanner={() => setOverlay({ kind: 'scanner' })}
            onOpenCoach={() => setOverlay({ kind: 'coach' })}
          />
        );
      case 'you':
        return (
          <You
            streak={streak}
            onOpenJourney={() => setOverlay({ kind: 'journey' })}
            onReplayCeremony={() => setOverlay({ kind: 'daycomplete' })}
          />
        );
    }
  };

  return (
    <SkinDataProvider value={d}>
      <div className="att-root">
        <div className="att-stage">
          <div className="att-brandbar">
            <span className="att-word">ATTIRA</span>
            <span className="att-tag">Skin</span>
          </div>
          <PhoneFrame>
            <div key={tab} className="att-screen-enter" style={{ position: 'absolute', inset: 0 }}>
              {screen()}
            </div>

            {overlay === null && <BottomNav active={tab} onChange={go} />}

            {overlay?.kind === 'checkin' && (
              <Overlayer>
                <CheckInFlow
                  onDone={() => {
                    fire(
                      logCheckIn({
                        indicators: Object.fromEntries(d.indicators.map((i) => [i.key, i.value])),
                        score: d.score,
                      }),
                    );
                    setOverlay(null);
                  }}
                />
              </Overlayer>
            )}

            {overlay?.kind === 'ritual' && (
              <Overlayer>
                <RitualScreen
                  which={overlay.which}
                  streak={streak}
                  onBack={() => setOverlay(null)}
                  onComplete={() => {
                    if (overlay.which === 'pm') {
                      setOverlay({ kind: 'daycomplete' });
                    } else {
                      fire(completeRitual('am'));
                      setOverlay(null);
                      setTab('today');
                    }
                  }}
                />
              </Overlayer>
            )}

            {overlay?.kind === 'daycomplete' && (
              <Overlayer>
                <DayComplete
                  onClose={() => {
                    if (!nightDone) fire(completeRitual('pm'));
                    setNightDone(true);
                    setStreak((s) => (nightDone ? s : s + 1));
                    setOverlay(null);
                    setTab('today');
                  }}
                />
              </Overlayer>
            )}

            {overlay?.kind === 'journey' && (
              <Overlayer>
                <Journey streak={streak} onBack={() => setOverlay(null)} />
              </Overlayer>
            )}

            {overlay?.kind === 'ingredient' && (
              <Overlayer>
                <IngredientDetail id={overlay.id} onBack={() => setOverlay(null)} />
              </Overlayer>
            )}

            {overlay?.kind === 'weekly' && (
              <Overlayer>
                <WeeklyReport onBack={() => setOverlay(null)} onOpenCoach={() => setOverlay({ kind: 'coach' })} />
              </Overlayer>
            )}

            {overlay?.kind === 'coach' && (
              <Overlayer>
                <Coach onBack={() => setOverlay(null)} onOpenIngredient={(id) => setOverlay({ kind: 'ingredient', id })} />
              </Overlayer>
            )}

            {overlay?.kind === 'scanner' && (
              <Overlayer>
                <ProductScanner onBack={() => setOverlay(null)} />
              </Overlayer>
            )}
          </PhoneFrame>
        </div>
      </div>
    </SkinDataProvider>
  );
}

/* A full-cover layer above the bottom nav for immersive moments. */
function Overlayer({ children }: { children: React.ReactNode }) {
  return (
    <div className="att-screen-enter" style={{ position: 'absolute', inset: 0, zIndex: 50 }}>
      {children}
    </div>
  );
}
