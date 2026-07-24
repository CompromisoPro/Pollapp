import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Fiesta from "@/components/ganadores/Fiesta";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data } = await supabase
    .from("score_breakdown")
    .select("full_name, points_total")
    .order("points_total", { ascending: false })
    .limit(3);
  const winners = (data ?? []) as { full_name: string | null; points_total: number }[];

  return <Fiesta winners={winners} />;
}
