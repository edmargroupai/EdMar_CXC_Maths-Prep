import { describe, expect, it } from "vitest";
import { questionAssetCandidates } from "@edmar/design/blocks";

describe("questionAssetCandidates", () => {
  it("prefers same-origin SVG then raster for workbook jpeg paths", () => {
    const urls = questionAssetCandidates(
      "assets/question_visuals/p241_q01.jpg",
      "https://example.supabase.co",
    );
    expect(urls[0]).toBe("/question-visuals/p241_q01.svg");
    expect(urls).toContain(
      "https://example.supabase.co/storage/v1/object/public/question-assets/assets/question_visuals/p241_q01.jpg",
    );
  });

  it("passes through absolute URLs", () => {
    expect(questionAssetCandidates("https://cdn.example/fig.png")).toEqual([
      "https://cdn.example/fig.png",
    ]);
  });
});
