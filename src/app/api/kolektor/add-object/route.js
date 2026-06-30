import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !['KOLEKTOR', 'VERIFIKATOR', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, address, blok, minValue, maxValue, villageId } = body;

    const targetVillageId = session.role === 'KOLEKTOR' ? session.villageId : villageId;

    if (!targetVillageId) {
      return NextResponse.json({ error: 'Village ID is required' }, { status: 400 });
    }

    if (!categoryId || !address) {
      return NextResponse.json({ error: 'Kategori dan Alamat wajib diisi' }, { status: 400 });
    }

    // Create the TaxObject
    const newObj = await prisma.taxObject.create({
      data: {
        address,
        blok: blok || null,
        zntCode: null,
        villageId: targetVillageId,
        categoryId: categoryId,
        marketValueRecords: {
          create: {
            minValue: minValue ? parseFloat(minValue) : null,
            maxValue: maxValue ? parseFloat(maxValue) : null,
            status: 'PENDING'
          }
        }
      }
    });

    return NextResponse.json({ success: true, message: 'Alamat objek pajak berhasil ditambahkan' });

  } catch (error) {
    console.error('Add Object Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
