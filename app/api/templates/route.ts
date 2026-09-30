import { NextResponse } from "next/server";
import { listPublishedTemplates } from "@/lib/templates-db";

/** GET /api/templates — katalog template yang published. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "all";
  return NextResponse.json({ data: await listPublishedTemplates(category) });
}
