import { NextResponse } from "next/server";

export async function POST() {
  // Stub — TASK-018 replaces with real persistence + email
  return NextResponse.json({ ok: true });
}
