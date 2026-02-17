import { NextRequest, NextResponse } from 'next/server';

// Midtrans API configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Get Midtrans API URL based on environment
const getMidtransUrl = () => {
  return IS_PRODUCTION 
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, customerName, customerNim, paymentType } = body;

    console.log('Create transaction request:', { orderId, amount, customerName, customerNim, paymentType });
    console.log('Midtrans config:', { 
      hasServerKey: !!MIDTRANS_SERVER_KEY, 
      hasClientKey: !!MIDTRANS_CLIENT_KEY, 
      isProduction: IS_PRODUCTION 
    });

    if (!MIDTRANS_SERVER_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'Midtrans server key not configured',
        details: 'Pastikan MIDTRANS_SERVER_KEY sudah di-set di environment variables'
      }, { status: 500 });
    }

    // Minimum amount check
    if (amount < 10000) {
      return NextResponse.json({ 
        success: false,
        error: 'Minimal pembayaran Rp 10.000',
        details: 'Midtrans membutuhkan minimal Rp 10.000 untuk transaksi'
      }, { status: 400 });
    }

    // Create transaction request to Midtrans
    const midtransPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount
      },
      customer_details: {
        first_name: customerName,
        email: `${customerNim}@kaskita.local`,
        phone: ''
      },
      item_details: [
        {
          id: paymentType.replace(/\s+/g, '_'),
          price: amount,
          quantity: 1,
          name: `Kas ${paymentType} - ${customerName}`.substring(0, 50)
        }
      ],
      // Enable QRIS only
      enabled_payments: ['qris'],
      // Callback URLs
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://sistemkas25.vercel.app'}?payment=finish`
      }
    };

    console.log('Midtrans payload:', JSON.stringify(midtransPayload, null, 2));

    const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString('base64');
    
    const response = await fetch(getMidtransUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(midtransPayload)
    });

    const data = await response.json();
    console.log('Midtrans response:', data);

    if (!response.ok) {
      console.error('Midtrans error:', data);
      
      // Handle specific Midtrans errors
      let errorMessage = data.error_messages?.[0] || 'Failed to create transaction';
      
      if (errorMessage.includes('Access denied')) {
        errorMessage = 'Akses ditolak. Pastikan Server Key benar dan akun sudah aktif.';
      } else if (errorMessage.includes('Merchant')) {
        errorMessage = 'Akun merchant belum terverifikasi. Silakan hubungi Midtrans.';
      } else if (errorMessage.includes('amount')) {
        errorMessage = 'Nominal tidak valid. Minimal Rp 10.000.';
      }
      
      return NextResponse.json({ 
        success: false,
        error: errorMessage,
        details: data.error_messages || data,
        isProduction: IS_PRODUCTION
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      token: data.token,
      redirectUrl: data.redirect_url,
      clientKey: MIDTRANS_CLIENT_KEY,
      isProduction: IS_PRODUCTION
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Gagal menghubungi Midtrans',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
