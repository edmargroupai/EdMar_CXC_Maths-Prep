import type { MathRender } from "@edmar/types";

export type MathSvgProps = {
  render: MathRender;
  latex?: string;
  alt?: string;
  style?: "inline" | "display";
};

export function MathSvg({ render, latex, alt, style = "inline" }: MathSvgProps) {
  const label = alt ?? latex ?? "Mathematical expression";
  const width = `${render.widthEx}ex`;
  const height = `${render.heightEx + render.depthEx}ex`;
  const verticalAlign =
    style === "inline" ? `${-render.depthEx}ex` : undefined;

  return (
    <span
      className={style === "display" ? "my-2 block text-center" : "inline-block align-baseline"}
      style={{ width, height, verticalAlign }}
      role="img"
      aria-label={label}
      dangerouslySetInnerHTML={{ __html: render.svg }}
    />
  );
}
