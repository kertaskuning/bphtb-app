import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      include: {
        village: {
          include: { district: true }
        }
      },
      orderBy: { role: 'asc' }
    });

    const villages = await prisma.village.findMany({
      include: { district: true },
      orderBy: { name: 'asc' }
    });

    // Remove hashed passwords before sending to client
    const safeUsers = users.map(u => {
      const { password, ...rest } = u;
      return rest;
    });

    return NextResponse.json({ success: true, users: safeUsers, villages });

  } catch (error) {
    console.error('Fetch Accounts Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'RESET_PASSWORD') {
      const { userId, newPassword } = body;
      let rawPassword = newPassword;
      if (!rawPassword) {
        const userToReset = await prisma.user.findUnique({ where: { id: userId } });
        if (!userToReset) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        
        rawPassword = userToReset.role === 'KOLEKTOR' ? '12345678' : 'admin123';
      }

      const hashedPassword = await bcrypt.hash(rawPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, isPasswordChanged: false }
      });

      return NextResponse.json({ success: true, message: 'Password berhasil direset.' });
    }

    if (action === 'CREATE_USER') {
      const { newUsername, newPassword, newRole, villageId } = body;

      if (!newUsername || !newPassword || !newRole) {
        return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({ where: { username: newUsername } });
      if (existing) {
        return NextResponse.json({ error: 'Username sudah digunakan' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await prisma.user.create({
        data: {
          username: newUsername,
          password: hashedPassword,
          role: newRole,
          villageId: newRole === 'KOLEKTOR' ? villageId : null,
          isPasswordChanged: false
        }
      });

      return NextResponse.json({ success: true, message: 'Akun berhasil dibuat.' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (error) {
    console.error('Account Action Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
