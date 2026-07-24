import Fiesta from "@/components/ganadores/Fiesta";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GanadoresPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("score_breakdown")
    .select("full_name, points_total")
    .order("points_total", { ascending: false })
    .limit(3);
  const winners = (data ?? []) as { full_name: string | null; points_total: number }[];

  return <Fiesta winners={winners} />;
}
