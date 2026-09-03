import type { ReactNode } from "react";
import type { Block, MathRender } from "@edmar/types";
import { AssetImage } from "./AssetImage";
import { MathSvg } from "./MathSvg";

export type BlockRendererProps = {
  blocks: Block[];
  mathRenders?: Record<string, MathRender>;
  className?: string;
  supabaseUrl?: string | null;
};

function renderBlock(
  block: Block,
  mathRenders: Record<string, MathRender>,
  key: string | number,
  supabaseUrl?: string | null,
): ReactNode {
  switch (block.type) {
    case "text":
      return (
        <span key={key} className="whitespace-pre-wrap">
          {block.value}
        </span>
      );
    case "math": {
      const render = mathRenders[block.renderHash];
      if (render) {
        return (
          <MathSvg
            key={key}
            render={render}
            latex={block.latex}
            alt={block.alt}
            style={block.style}
          />
        );
      }
      return (
        <code key={key} className="font-mono text-sm">
          {block.latex}
        </code>
      );
    }
    case "mixed":
      return (
        <span key={key}>
          {block.runs.map((run, index) =>
            run.type === "text" ? (
              <span key={index}>{run.value}</span>
            ) : (
              renderBlock(
                {
                  type: "math",
                  latex: run.latex,
                  style: "inline",
                  renderHash: run.renderHash,
                },
                mathRenders,
                index,
                supabaseUrl,
              )
            ),
          )}
        </span>
      );
    case "list":
      return block.ordered ? (
        <ol key={key} className="list-decimal pl-5">
          {block.items.map((item, index) => (
            <li key={index}>
              <BlockRenderer blocks={item} mathRenders={mathRenders} supabaseUrl={supabaseUrl} />
            </li>
          ))}
        </ol>
      ) : (
        <ul key={key} className="list-disc pl-5">
          {block.items.map((item, index) => (
            <li key={index}>
              <BlockRenderer blocks={item} mathRenders={mathRenders} supabaseUrl={supabaseUrl} />
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <figure key={key} className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            {block.header ? (
              <thead>
                <tr>
                  {block.header.map((cell, index) => (
                    <th key={index} className="border border-navy/10 px-2 py-1 text-left">
                      {cell}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-navy/10 px-2 py-1">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption ? (
            <figcaption className="mt-1 text-xs text-navy/60">{block.caption}</figcaption>
          ) : null}
        </figure>
      );
    case "asset":
      return (
        <AssetImage
          key={key}
          storagePath={block.storagePath}
          altText={block.altText}
          supabaseUrl={supabaseUrl}
        />
      );
    default:
      return null;
  }
}

export function BlockRenderer({
  blocks,
  mathRenders = {},
  className = "",
  supabaseUrl = null,
}: BlockRendererProps) {
  return (
    <div className={`space-y-2 text-base leading-relaxed text-navy ${className}`}>
      {blocks.map((block, index) => renderBlock(block, mathRenders, index, supabaseUrl))}
    </div>
  );
}
