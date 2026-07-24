"use client";

import React, { useState } from "react";

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
 * Click-to-play YouTube facade: shows the video thumbnail with a play
 * button; the real player iframe loads only after the user clicks.
 * (Faster page loads, and privacy/ad blockers don't blank it out.)
 */
function VideoEmbed({ vid }: { vid: string }) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <div className="mt-4 overflow-hidden rounded-xl">
        <iframe
          src={`https://www.youtube.com/embed/${vid}?autoplay=1`}
          title="YouTube video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative mt-4 block w-full overflow-hidden rounded-xl"
      aria-label="Play video"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`}
        alt=""
        className="aspect-video w-full object-cover"
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/30">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-red)] pl-1 text-2xl text-white shadow-lg">
          ▶
        </span>
      </span>
    </button>
  );
}
