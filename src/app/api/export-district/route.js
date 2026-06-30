import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import * as xlsx from 'xlsx';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session || !['VERIFIKATOR', 'SUPERADMIN', 'KECAMATAN'].includes(session.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const districtId = searchParams.get('districtId');

    if (!districtId) {
      return NextResponse.json({ error: 'District ID required' }, { status: 400 });
    }

    // Get the district name for the filename
    const district = await prisma.district.findUnique({
      where: { id: districtId }
    });

    if (!district) {
      return NextResponse.json({ error: 'District not found' }, { status: 404 });
    }

    // Fetch all tax objects for this district
    const taxObjects = await prisma.taxObject.findMany({
      where: { 
        village: { districtId: districtId },
        isDeleted: false // Always exclude soft-deleted for excel export
      },
      include: {
        category: true,
        village: true,
        marketValueRecords: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      },
      orderBy: [
        { village: { name: 'asc' } },
        { category: { name: 'asc' } },
        { address: 'asc' }
      ]
    });

    // Format data for Excel
    const excelData = taxObjects.map((obj, index) => {
      const record = obj.marketValueRecords[0];
      
      const formatCurrency = (val) => {
        if (val === null || val === undefined) return '-';
        return 'Rp ' + val.toLocaleString('id-ID');
      };

      return {
        'No.': index + 1,
        'Kecamatan': district.name,
        'Kelurahan/Desa': obj.village.name,
        'Kategori': obj.category.name,
        'Alamat': obj.address,
        'Kode ZNT': obj.zntCode || '-',
        'Blok': obj.blok || '-',
        'Nilai Terendah /m2': formatCurrency(record?.minValue),
        'Nilai Tertinggi /m2': formatCurrency(record?.maxValue),
        'Status': record?.status || 'PENDING'
      };
    });

    // If no data, return a single row indicating empty
    if (excelData.length === 0) {
      excelData.push({
        'No.': '-', 'Kecamatan': district.name, 'Kelurahan/Desa': '-', 'Kategori': '-', 
        'Alamat': 'TIDAK ADA DATA', 'Kode ZNT': '-', 'Blok': '-', 
        'Nilai Terendah /m2': '-', 'Nilai Tertinggi /m2': '-', 'Status': '-'
      });
    }

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    
    // Set column widths
    const columnWidths = [
      { wch: 5 },  // No.
      { wch: 20 }, // Kecamatan
      { wch: 20 }, // Kelurahan/Desa
      { wch: 25 }, // Kategori
      { wch: 40 }, // Alamat
      { wch: 10 }, // Kode ZNT
      { wch: 10 }, // Blok
      { wch: 20 }, // Nilai Terendah
      { wch: 20 }, // Nilai Tertinggi
      { wch: 15 }  // Status
    ];
    worksheet['!cols'] = columnWidths;

    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Data Objek Pajak');

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Disposition': `attachment; filename="Data_Objek_Pajak_${district.name.replace(/\s+/g, '_')}.xlsx"`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });

  } catch (error) {
    console.error('Error generating excel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
