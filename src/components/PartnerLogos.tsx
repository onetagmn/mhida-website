"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";

type PartnerLink = {
  id: string;
  name: string;
  logo_url: string;
  url: string;
  sort_order: number;
};

/** Row of partner/social logos on the homepage — each opens its link. */
export default function PartnerLogos() {
  const { t } = useLanguage();
  const [links, setLinks] = useState<PartnerLink[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("partner_links")
        .select("id, name, logo_url, url, sort_order")
        .order("sort_order");
      setLinks(data ?? []);
    })();
  }, []);

  if (links.length === 0) return null;

  return (
    <section className="border-t border-slate-200 bg-white py-10">
      <div className="container-page">
        <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
          {t("Холбоос ба түншүүд", "Links & Partners")}
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              title={l.name}
              className="opacity-80 grayscale-[30%] transition-all hover:opacity-100 hover:grayscale-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.logo_url} alt={l.name} className="h-14 w-auto max-w-[160px] object-contain" loading="lazy" />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
