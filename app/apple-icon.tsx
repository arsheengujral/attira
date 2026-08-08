import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/brand-mark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon for iOS ("Add to Home Screen"). */
export default function AppleIcon() {
  return new ImageResponse(<BrandMark size={180} />, { ...size });
}
