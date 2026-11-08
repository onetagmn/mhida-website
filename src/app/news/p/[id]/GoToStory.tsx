"use client";

import { useEffect } from "react";
import Link from "next/link";
import { asset } from "@/lib/asset";

// Sends a visitor from a story's share page on to the story itself
// (link crawlers like Facebook's read the page without running this).
export default function GoToStory({ id, title }: { id: string | null; title: string | null }) {
  const target = id ? `/news/?id=${id}` : "/news/";
  useEffect(() => {
    window.location.replace(asset(target));
  }, [target]);
  return (
    <div className="container-page py-16 text-center">
      {title && <h1 className="text-xl font-bold text-slate-900">{title}</h1>}
      <p className="mt-3 text-sm text-slate-500">
        <Link href={target} className="font-semibold text-[var(--brand-blue)]">Мэдээг нээх → / Open the story →</Link>
      </p>
    </div>
  );
}
