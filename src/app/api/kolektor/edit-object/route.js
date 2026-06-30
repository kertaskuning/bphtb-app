import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !['KOLEKTOR', 'VERIFIKATOR', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { taxObjectId, address, zntCode, blok } = await request.json();

    if (!taxObjectId || !address) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // Verify ownership
    const taxObject = await prisma.taxObject.findUnique({
      where: { id: taxObjectId }
    });

    if (!taxObject) {
      return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    if (session.role === 'KOLEKTOR' && taxObject.villageId !== session.villageId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.taxObject.update({
      where: { id: taxObjectId },
      data: {
        address,
        zntCode: zntCode || null,
        blok: blok || null
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Edit Object Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
