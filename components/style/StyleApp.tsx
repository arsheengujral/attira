'use client';

import { useState } from 'react';
import { PhoneFrame } from '../shell';
import { Assessment } from './Assessment';
import { StyleResultView } from './StyleResult';
import { computeStyleProfile, diffStyleResults, type StyleProfileInput, type StyleResult } from '@/lib/style/compute';
import { saveStyleProfile } from '@/lib/style/actions';

function fire(p: Promise<unknown>) {
  void p.catch(() => {});
}

/** Map a stored/known input back to the assessment's selection values. */
function toSelections(input: StyleProfileInput): Record<string, string> {
  return {
    gender: input.gender ?? '',
    undertone: input.undertone ?? '',
    depth: input.depth ?? '',
    face_shape: input.faceShape ?? '',
    body_shape: input.bodyShape ?? '',
    persona: input.persona ?? '',
    coverage: input.coverage ?? '',
    world: input.world ?? '',
    fit: input.fit ?? '',
  };
}

export default function StyleApp({ initial }: { initial?: (StyleProfileInput & Record<string, unknown>) | null }) {
  const hasSaved = Boolean(initial && initial.gender);
  const [mode, setMode] = useState<'assessment' | 'result'>(hasSaved ? 'result' : 'assessment');
  const [input, setInput] = useState<StyleProfileInput | null>(hasSaved ? (initial as StyleProfileInput) : null);
  const [result, setResult] = useState<StyleResult | null>(hasSaved ? computeStyleProfile(initial as StyleProfileInput) : null);
  const [changed, setChanged] = useState<string[]>([]);

  return (
    <div className="att-root">
      <div className="att-stage">
        <div className="att-brandbar">
          <span className="att-word">ATTIRA</span>
          <span className="att-tag">Style</span>
        </div>
        <PhoneFrame>
          <div key={mode} className="att-screen-enter" style={{ position: 'absolute', inset: 0 }}>
            {mode === 'assessment' || !result ? (
              <Assessment
                initial={input ? toSelections(input) : undefined}
                onSubmit={(nextInput, nextResult) => {
                  if (result) setChanged(diffStyleResults(result, nextResult));
                  setInput(nextInput);
                  setResult(nextResult);
                  setMode('result');
                  fire(saveStyleProfile(nextInput));
                }}
              />
            ) : (
              <StyleResultView result={result} changed={changed} onRetake={() => { setChanged([]); setMode('assessment'); }} />
            )}
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
