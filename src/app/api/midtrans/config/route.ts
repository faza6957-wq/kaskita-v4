import { NextResponse } from 'next/server';

export async function GET() {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
  const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';
  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';

  return NextResponse.json({
    configured: !!(serverKey && clientKey),
    clientKey: clientKey,
    isProduction: isProduction
  });
}
