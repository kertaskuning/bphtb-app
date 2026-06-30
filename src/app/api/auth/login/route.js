import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { setSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Update lastLoginAt (safely, in case schema isn't fully synced on dev server)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    } catch (updateErr) {
      console.warn('Failed to update lastLoginAt (server might need restart):', updateErr.message);
    }

    // Set session
    await setSession({
      id: user.id,
      username: user.username,
      role: user.role,
      villageId: user.villageId,
      districtId: user.districtId,
      isPasswordChanged: user.isPasswordChanged
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        username: user.username,
        role: user.role,
        isPasswordChanged: user.isPasswordChanged
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
