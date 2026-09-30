import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditClient from "./edit-client";

export default async function EditPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, title, slug, status, content, template_id, templates(slug)")
    .eq("id", params.id)
    .maybeSingle();
  if (!wedding) redirect("/dashboard");
  return <EditClient wedding={wedding as never} />;
}
