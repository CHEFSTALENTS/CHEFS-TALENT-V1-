import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_PASSWORD = 'chef2025' // ⬅️ change-le si tu veux

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })

  response.cookies.set('ct_admin', 'true', {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24, // 24h
  })

  return response
}
