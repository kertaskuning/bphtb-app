import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'VERIFIKATOR' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { records } = await request.json(); 
    // records = [{ id: recordId, action: 'APPROVE' | 'REJECT', notes: '...' }]

    for (const item of records) {
      await prisma.marketValueRecord.update({
        where: { id: item.id },
        data: {
          status: item.action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
          notes: item.notes || null
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Verify Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
