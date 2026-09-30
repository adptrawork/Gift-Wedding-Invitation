import { NextResponse } from "next/server";
import { listTemplates } from "@/lib/templates";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "all";
  return NextResponse.json({ data: listTemplates(category) });
}
