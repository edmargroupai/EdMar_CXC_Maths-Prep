"use client";

import { useState } from "react";
import { questionAssetCandidates } from "./assetUrl";

type AssetImageProps = {
  storagePath: string;
  altText: string;
  supabaseUrl?: string | null;
};

export function AssetImage({ storagePath, altText, supabaseUrl }: AssetImageProps) {
  const candidates = questionAssetCandidates(storagePath, supabaseUrl);
  const [index, setIndex] = useState(0);

  if (index >= candidates.length) {
    return (
      <p className="rounded-lg border border-navy/10 bg-sky/40 px-3 py-2 text-sm text-navy/70">
        Diagram could not be loaded. {altText}
      </p>
    );
  }

  const src = candidates[index]!;

  return (
    <figure className="my-4">
      <img
        src={src}
        alt={altText}
        className="mx-auto max-h-[28rem] w-auto max-w-full rounded-lg border border-navy/10 bg-white"
        onError={() => setIndex((current) => current + 1)}
      />
    </figure>
  );
}
