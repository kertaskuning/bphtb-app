import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'KOLEKTOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const villageId = session.villageId;

    const taxObjects = await prisma.taxObject.findMany({
      where: { 
        villageId: session.villageId,
        isDeleted: false
      },
      include: {
        category: true,
        marketValueRecords: true
      }
    });

    const total = taxObjects.length;
    let completed = 0;
    let pending = 0;
    let verified = 0;
    let rejected = 0;

    taxObjects.forEach(obj => {
      const record = obj.marketValueRecords[0];
      if (!record || record.status === 'PENDING') pending++;
      else if (record.status === 'SUBMITTED') completed++;
      else if (record.status === 'VERIFIED') verified++;
      else if (record.status === 'REJECTED') rejected++;
    });

    const normalizeAddress = (addr) => {
      let s = (addr || '').toUpperCase().trim();
      s = s.replace(/\bBLK\b/g, 'BLOK').replace(/\bJL\b/g, 'JALAN').replace(/\bJLN\b/g, 'JALAN').replace(/\bGG\b/g, 'GANG').replace(/\bKP\b/g, 'KAMPUNG').replace(/\bDS\b/g, 'DESA');
      return s.replace(/[^A-Z0-9]/g, '');
    };

    // Group by category, address and blok
    const grouped = {};
    taxObjects.forEach(obj => {
      const catName = obj.category.name;
      if (!grouped[catName]) grouped[catName] = [];
      
      const addrNormalized = normalizeAddress(obj.address);
      const groupKey = `${addrNormalized}`;
      
      let existing = grouped[catName].find(g => g.groupKey === groupKey);
      
      if (!existing) {
        existing = {
          id: obj.id,
          groupKey,
          address: obj.address,
          zntCodeDisplay: new Set([obj.zntCode].filter(Boolean)),
          blokDisplay: new Set([obj.blok].filter(Boolean)),
          record: obj.marketValueRecords[0],
          underlying: [{ taxObjectId: obj.id, recordId: obj.marketValueRecords[0]?.id, zntCode: obj.zntCode, blok: obj.blok }]
        };
        grouped[catName].push(existing);
      } else {
        if (obj.zntCode) existing.zntCodeDisplay.add(obj.zntCode);
        if (obj.blok) existing.blokDisplay.add(obj.blok);
        existing.underlying.push({ taxObjectId: obj.id, recordId: obj.marketValueRecords[0]?.id, zntCode: obj.zntCode, blok: obj.blok });
        if ((!existing.record || !existing.record.id) && obj.marketValueRecords[0]) {
          existing.record = obj.marketValueRecords[0];
        }
        if ((obj.address || '').length > (existing.address || '').length) {
          existing.address = obj.address; // Use the longest string for display (e.g., BLOK instead of BLK)
        }
      }
    });

    Object.keys(grouped).forEach(cat => {
      grouped[cat] = grouped[cat].map(g => {
        let cleanAddress = g.address || '';
        // Automatically standardize BLK to BLOK for display
        cleanAddress = cleanAddress.replace(/\bBLK\b/gi, 'BLOK');
        
        return {
          ...g,
          address: cleanAddress,
          zntCode: Array.from(g.zntCodeDisplay).sort().join(', '),
          blok: Array.from(g.blokDisplay).sort().join(', ')
        };
      });
      
      // Sort alphabetically by address, then by blok
      grouped[cat].sort((a, b) => {
        const addrA = (a.address || '').toLowerCase();
        const addrB = (b.address || '').toLowerCase();
        if (addrA < addrB) return -1;
        if (addrA > addrB) return 1;
        
        const blokA = (a.blok || '').toLowerCase();
        const blokB = (b.blok || '').toLowerCase();
        if (blokA < blokB) return -1;
        if (blokA > blokB) return 1;
        
        return 0;
      });
    });

    const categories = await prisma.taxObjectCategory.findMany({ orderBy: { name: 'asc' } });
    
    const villageInfo = await prisma.village.findUnique({
      where: { id: villageId },
      include: { district: true }
    });

    return NextResponse.json({
      success: true,
      stats: { total, pending, completed, verified, rejected },
      grouped,
      categories,
      villageInfo
    });

  } catch (error) {
    console.error('Kolektor Dashboard Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
