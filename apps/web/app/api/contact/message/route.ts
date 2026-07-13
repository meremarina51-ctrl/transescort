import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function backendBase(): string {
  const u = process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://127.0.0.1:3010';
  return u.replace(/\/$/, '');
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  let res: Response;
  try {
    res = await fetch(`${backendBase()}/contact/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return NextResponse.json({ message: 'Сервис временно недоступен (API не отвечает).' }, { status: 502 });
  }

  const out = new NextResponse(await res.arrayBuffer(), { status: res.status });
  const contentType = res.headers.get('content-type');
  if (contentType) out.headers.set('content-type', contentType);
  return out;
}
