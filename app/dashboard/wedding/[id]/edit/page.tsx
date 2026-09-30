import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditClient from "./edit-client";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Filter user_id WAJIB. RLS membuat wedding published bisa dibaca user lain,
  // jadi tanpa filter ini siapa pun yang tahu UUID bisa membuka & membaca
  // konten customer lain.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, title, slug, status, published_at, draft_content, content, templates(slug, name)")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wedding) redirect("/dashboard");

  return <EditClient wedding={wedding as never} />;
}
