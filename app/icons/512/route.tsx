import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/brand-mark';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(<BrandMark size={512} />, { width: 512, height: 512 });
}
