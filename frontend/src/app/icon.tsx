import { ImageResponse } from 'next/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: '#172554',
          color: '#ffffff',
          display: 'flex',
          fontSize: 42,
          fontWeight: 800,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        E<span style={{ color: '#d4a853' }}>.</span>
      </div>
    ),
    size,
  );
}
