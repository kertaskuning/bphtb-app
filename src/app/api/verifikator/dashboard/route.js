import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'VERIFIKATOR' && session.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const villages = await prisma.village.findMany({
      include: {
        district: true,
        taxObjects: {
          include: {
            marketValueRecords: true
          }
        }
      }
    });

    let notInputted = 0;
    let inputted = 0;
    let notVerified = 0;
    let verified = 0;

    const villageProgress = villages.map(village => {
      const totalTaxObjects = village.taxObjects.length;
      let p_pending = 0;
      let p_submitted = 0;
      let p_verified = 0;
      let p_rejected = 0;

      village.taxObjects.forEach(obj => {
        const record = obj.marketValueRecords[0];
        if (!record || record.status === 'PENDING') p_pending++;
        else if (record.status === 'SUBMITTED') p_submitted++;
        else if (record.status === 'VERIFIED') p_verified++;
        else if (record.status === 'REJECTED') p_rejected++;
      });

      // Village level classification
      if (p_pending === totalTaxObjects && totalTaxObjects > 0) {
        notInputted++;
      } else if (p_verified === totalTaxObjects && totalTaxObjects > 0) {
        verified++;
        inputted++;
      } else if (p_submitted > 0 || p_rejected > 0 || p_verified > 0) {
        // Partially or fully submitted but not all verified
        inputted++;
        notVerified++;
      } else if (totalTaxObjects === 0) {
        notInputted++;
      }

      return {
        id: village.id,
        name: village.name,
        district: village.district.name,
        districtId: village.districtId,
        totalTaxObjects,
        stats: {
          pending: p_pending,
          submitted: p_submitted,
          verified: p_verified,
          rejected: p_rejected
        }
      };
    });

    return NextResponse.json({
      success: true,
      stats: { notInputted, inputted, notVerified, verified },
      villageProgress
    });

  } catch (error) {
    console.error('Verifikator Dashboard Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
