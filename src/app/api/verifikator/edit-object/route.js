import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !['VERIFIKATOR', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids, address, zntCode, blok } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Array of IDs is required' }, { status: 400 });
    }

    const result = await prisma.taxObject.updateMany({
      where: { id: { in: ids } },
      data: {
        address,
        zntCode,
        blok
      }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error editing object:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
