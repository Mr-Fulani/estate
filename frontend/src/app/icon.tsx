import { fetchSiteSettings } from '@/lib/api';
import { brandInitials } from '@/lib/site-profile';
import { getSiteOrigin } from '@/lib/site-config';
import { ImageResponse } from 'next/og';

export const dynamic = 'force-dynamic';
export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default async function Icon() {
  const settings = await fetchSiteSettings();
  if (settings.profile?.icon_url) return Response.redirect(new URL(settings.profile.icon_url, getSiteOrigin()), 307);
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#172554',
          color: '#ffffff',
          display: 'flex',
          fontSize: 27,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        {brandInitials(settings)}<span style={{ color: '#d4a853' }}>.</span>
      </div>
    ),
    size,
  );
}
