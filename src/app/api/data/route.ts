import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataPath = path.join(process.cwd(), 'data', 'bendahara-db.json');

// Lock mechanism to prevent race conditions
let writeLock = false;
let writeQueue: (() => void)[] = [];

function readData() {
  try {
    const data = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function writeData(data: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const doWrite = () => {
      writeLock = true;
      try {
        // Ensure directory exists
        const dir = path.dirname(dataPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        writeLock = false;
        // Process next in queue
        const next = writeQueue.shift();
        if (next) next();
        resolve();
      } catch (error) {
        writeLock = false;
        const next = writeQueue.shift();
        if (next) next();
        reject(error);
      }
    };

    if (writeLock) {
      writeQueue.push(doWrite);
    } else {
      doWrite();
    }
  });
}

export async function GET() {
  // Wait if there's a write in progress
  while (writeLock) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  const data = readData();
  if (!data) {
    return NextResponse.json({ error: 'Data not found' }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await writeData(body);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
