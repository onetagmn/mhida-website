"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Clinic names already in use (official names, see
// migration26_clinic_names.sql), offered as suggestions while a member
// types their workplace, so they pick the existing name instead of
// creating a new spelling of the same clinic.
export function useWorkplaceNames() {
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc("facility_stats");
      const rows = (data as { workplace: string | null }[]) ?? [];
      const unique = [...new Set(rows.map((r) => (r.workplace ?? "").trim()).filter(Boolean))];
      setNames(unique.sort((a, b) => a.localeCompare(b, "mn")));
    })();
  }, []);
  return names;
}
