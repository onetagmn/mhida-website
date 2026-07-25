"use client";

import React from "react";

// Matches full URLs AND protocol-less YouTube links (people often paste
// "youtube.com/watch?v=..." or "www.youtube.com/..." without https://).
const URL_RE = /(https?:\/\/[^\s<>"']+|(?:www\.)?(?:m\.)?youtube\.com\/[^\s<>"']+|youtu\.be\/[^\s<>"']+)/g;

function youtubeId(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?(?:.*&)?v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/shorts\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/live\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/embed\/([\w-]{6,})/);
  return m ? m[1] : null;
}

function fullHref(url: string): string {
  return /^https?:\/\//.test(url) ? url : `https://${url}`;
}

/**
 * Renders news body text: preserves line breaks, makes URLs clickable,
 * and embeds a YouTube player for every YouTube link found.
 */
export default function NewsBody({ body }: { body: string }) {
  const videoIds: string[] = [];
  const parts = body.split(URL_RE);

  const rendered = parts.map((part, i) => {
    if (i % 2 === 1) {
      // odd indexes are URLs (capture group)
      const vid = youtubeId(part);
      if (vid && !videoIds.includes(vid)) videoIds.push(vid);
      return (
        <a
          key={i}
          href={fullHref(part)}
          target="_blank"
          rel="noopener noreferrer"
          className="break-all font-medium text-[var(--brand-blue)] underline decoration-blue-200 underline-offset-2 hover:text-[var(--brand-red)]"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });

  return (
    <div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{rendered}</div>
      {videoIds.map((vid) => (
        <VideoEmbed key={vid} vid={vid} />
      ))}
    </div>
  );
}

/**
 * Direct YouTube embed — a single player, loaded once. (We previously
 * used a click-to-play thumbnail facade, but it produced a confusing
 * "two play buttons" feel: our button, then YouTube's own paused state
 * again. A plain embed has exactly one play button — YouTube's.)
 */
function VideoEmbed({ vid }: { vid: string }) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl">
      <iframe
        src={`https://www.youtube.com/embed/${vid}?rel=0&modestbranding=1&playsinline=1`}
        title="Video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-full"
      />
    </div>
  );
}
