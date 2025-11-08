import { NextRequest, NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(message: string, status: number = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function parseJson<T>(req: NextRequest): Promise<T | null> {
  try {
    const body = await req.json();
    return body as T;
  } catch {
    return null;
  }
}


