import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'KOLEKTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Soft delete the object
    const updatedObject = await prisma.taxObject.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true, taxObject: updatedObject });
  } catch (error) {
    console.error('Error deleting object:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
