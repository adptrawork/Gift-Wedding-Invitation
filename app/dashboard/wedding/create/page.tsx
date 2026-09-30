import { redirect } from "next/navigation";
import { listPublishedTemplates } from "@/lib/templates-db";
import CreateClient from "./create-client";

export const dynamic = "force-dynamic";

export default async function CreatePage() {
  // Template create harus punya sesi — draft disimpan ke DB milik user itu.
  const templates = await listPublishedTemplates();
  if (templates.length === 0) redirect("/");

  return <CreateClient templates={templates} />;
}
