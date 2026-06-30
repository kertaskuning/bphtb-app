import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'KOLEKTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { records } = await request.json(); 
    // records = [{ id: recordId, minValue, maxValue, action: 'SAVE' | 'SUBMIT' }]

    for (const item of records) {
      await prisma.$transaction([
        prisma.marketValueRecord.update({
          where: { id: item.id },
          data: {
            minValue: item.minValue,
            maxValue: item.maxValue,
            status: (item.action === 'SUBMIT' && (item.minValue > 0 || item.maxValue > 0)) ? 'SUBMITTED' : 'PENDING'
          }
        }),
        prisma.taxObject.update({
          where: { id: item.taxObjectId },
          data: {
            address: item.address,
            zntCode: item.zntCode || null,
            blok: item.blok || null
          }
        })
      ]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Submit Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
