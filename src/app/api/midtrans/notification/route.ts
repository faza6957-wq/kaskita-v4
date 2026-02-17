import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'bendahara-db.json');

// Midtrans configuration
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || '';
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === 'true';

// Verify Midtrans signature
function verifySignature(orderId: string, statusCode: string, grossAmount: string, signatureKey: string): boolean {
  const signature = crypto
    .createHash('sha512')
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest('hex');
  return signature === signatureKey;
}

// Read and write data
function readData() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeData(data: any) {
  const dir = path.dirname(dataPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type
    } = body;

    console.log('Midtrans notification received:', {
      order_id,
      transaction_status,
      payment_type,
      gross_amount
    });

    // Verify signature
    if (!verifySignature(order_id, status_code, gross_amount, signature_key)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Check if transaction is successful
    const isSuccess = 
      (transaction_status === 'capture' || transaction_status === 'settlement') &&
      (fraud_status === 'accept' || !fraud_status);

    if (!isSuccess) {
      console.log('Transaction not successful:', transaction_status, fraud_status);
      return NextResponse.json({ status: 'ok', message: 'Transaction not successful' });
    }

    // Parse order_id to get student NIM
    // Format: KAS-{NIM}-{TIMESTAMP}
    const parts = order_id.split('-');
    if (parts.length < 3) {
      console.error('Invalid order_id format:', order_id);
      return NextResponse.json({ error: 'Invalid order_id' }, { status: 400 });
    }

    const nim = parts[1];

    // Read current data
    const data = readData();
    if (!data) {
      console.error('Data not found');
      return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    // Find student
    const studentIndex = data.students.findIndex((s: any) => s.nim === nim);
    if (studentIndex === -1) {
      console.error('Student not found:', nim);
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const student = data.students[studentIndex];
    const amount = parseInt(gross_amount);

    // Determine payment type from amount
    let newStatus = student.status;
    let keterangan = '';
    let transactionType = 'pemasukan_kas';

    if (student.denda > 0 && amount === student.denda) {
      // Denda payment
      newStatus = student.previousStatus || 'belum_bayar';
      if (newStatus.includes('pending')) newStatus = 'belum_bayar';
      keterangan = `Pembayaran Denda (QRIS) - ${student.nama}`;
      transactionType = 'pemasukan_denda';
      student.denda = 0;
      delete student.previousStatus;
    } else if (amount === data.settings.langsungLunasNominal) {
      newStatus = 'lunas';
      keterangan = `Kas Langsung Lunas (QRIS) - ${student.nama}`;
    } else if (amount === data.settings.gelombang1Nominal) {
      newStatus = 'verified_g1';
      keterangan = `Kas Gelombang 1 (QRIS) - ${student.nama}`;
    } else if (amount === data.settings.gelombang2Nominal) {
      newStatus = 'verified_g2';
      keterangan = `Kas Gelombang 2 (QRIS) - ${student.nama}`;
    } else if (amount === data.settings.gelombang3Nominal) {
      newStatus = 'lunas';
      keterangan = `Kas Gelombang 3 (QRIS) - ${student.nama}`;
    } else {
      // Unknown amount, just verify pending payment
      if (student.status === 'pending_g1') {
        newStatus = 'verified_g1';
        keterangan = `Kas Gelombang 1 (QRIS) - ${student.nama}`;
      } else if (student.status === 'pending_g2') {
        newStatus = 'verified_g2';
        keterangan = `Kas Gelombang 2 (QRIS) - ${student.nama}`;
      } else if (student.status === 'pending_g3') {
        newStatus = 'lunas';
        keterangan = `Kas Gelombang 3 (QRIS) - ${student.nama}`;
      } else if (student.status === 'pending_lunas') {
        newStatus = 'lunas';
        keterangan = `Kas Langsung Lunas (QRIS) - ${student.nama}`;
      } else if (student.status === 'pending_denda') {
        newStatus = student.previousStatus || 'belum_bayar';
        keterangan = `Pembayaran Denda (QRIS) - ${student.nama}`;
        transactionType = 'pemasukan_denda';
        student.denda = 0;
        delete student.previousStatus;
      }
    }

    // Update student status
    student.status = newStatus;
    student.rejectionReason = undefined;
    student.pendingSince = null;
    data.students[studentIndex] = student;

    // Create transaction record
    const now = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    const transaction = {
      id: Date.now().toString(),
      type: transactionType,
      nim: student.nim,
      nama: student.nama,
      nominal: amount,
      keterangan,
      tanggal: now.getDate().toString(),
      jam: `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}`,
      hari: days[now.getDay()],
      bulan: months[now.getMonth()],
      tahun: now.getFullYear().toString(),
      midtransOrderId: order_id,
      paymentMethod: 'QRIS'
    };

    data.transactions.push(transaction);

    // Save data
    writeData(data);

    console.log('Payment verified and recorded:', {
      nim: student.nim,
      nama: student.nama,
      amount,
      newStatus
    });

    return NextResponse.json({ status: 'ok', message: 'Payment verified' });

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
