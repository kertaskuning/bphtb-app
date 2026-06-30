import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !['VERIFIKATOR', 'SUPERADMIN', 'KOLEKTOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Array of IDs is required' }, { status: 400 });
    }

    // Soft delete the objects
    const result = await prisma.taxObject.updateMany({
      where: { id: { in: ids } },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
