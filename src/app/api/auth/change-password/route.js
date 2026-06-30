import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getSession } from '../../../../lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid old password' }, { status: 400 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: session.id },
      data: {
        password: hashedNewPassword,
        isPasswordChanged: true
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
