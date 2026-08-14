import { ImageResponse } from 'next/og';

const SIZE = { width: 1024, height: 512 };
// Static output — the banner never changes, so render it once and cache the PNG rather than
// re-fetching Google Fonts on every Telegram gate acceptance.
export const dynamic = 'force-static';

const WORDMARK = 'LuxEscortia';
const TAGLINE = 'Платформа проверенных анкет';

/** Google's css2 API serves woff2 to modern browsers; Satori only reads ttf/otf, so an old-browser UA forces the ttf variant. */
async function loadGoogleFont(family: string, weight: number, text: string): Promise<ArrayBuffer> {
  const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (
    await fetch(cssUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36' },
    })
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(?:opentype|truetype|woff)'\)/);
  if (!match) throw new Error(`Could not resolve font file for ${family}`);
  const res = await fetch(match[1]);
  return res.arrayBuffer();
}

/** Wordmark banner shown at the top of the Telegram bot's welcome message — see TelegramService.sendWelcome. */
export async function GET() {
  const [displayFont, bodyFont] = await Promise.all([
    loadGoogleFont('Unbounded', 800, WORDMARK),
    loadGoogleFont('Inter', 500, TAGLINE),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          backgroundImage: 'radial-gradient(60% 60% at 50% 30%, rgba(108,92,231,0.35), transparent 70%)',
        }}
      >
        <div style={{ display: 'flex', fontFamily: 'Unbounded', fontSize: 84, letterSpacing: -1 }}>
          <span style={{ color: '#A29BFE' }}>Lux</span>
          <span style={{ color: '#6C5CE7' }}>Escortia</span>
        </div>
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            fontFamily: 'Inter',
            fontSize: 28,
            color: 'rgba(255,255,255,0.55)',
          }}
        >
          {TAGLINE}
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [
        { name: 'Unbounded', data: displayFont, weight: 800, style: 'normal' },
        { name: 'Inter', data: bodyFont, weight: 500, style: 'normal' },
      ],
    },
  );
}
