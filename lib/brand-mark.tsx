import React from 'react';

/**
 * The ATTIRA app mark, drawn purely with layout primitives so it can be
 * rasterised by `next/og` (Satori) at any size with no font or binary asset.
 * A lavender rounded tile with a soft cream ring — a calm, brand-consistent
 * placeholder. Swap for a bespoke icon whenever one exists.
 */
export function BrandMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Math.round(size * 0.22),
        background: 'linear-gradient(135deg, #A995CF 0%, #8A76B4 100%)',
      }}
    >
      <div
        style={{
          width: Math.round(size * 0.46),
          height: Math.round(size * 0.46),
          borderRadius: size,
          border: `${Math.max(2, Math.round(size * 0.085))}px solid #F6F1FA`,
        }}
      />
    </div>
  );
}
