import { NextResponse } from "next/server";

export function jsonCode(status: number, code: string) {
  return NextResponse.json({ code }, { status });
}
