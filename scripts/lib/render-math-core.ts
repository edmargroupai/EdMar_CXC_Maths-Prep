import { createHash } from "node:crypto";
import { mathjax } from "mathjax-full/js/mathjax.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { SVG } from "mathjax-full/js/output/svg.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import type { Pool } from "pg";

export const RENDERER_VERSION = "mathjax-full@3.2.2";

export type MathRenderStyle = "inline" | "display";

export type LatexValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export type RenderedMath = {
  svg: string;
  widthEx: number;
  heightEx: number;
  depthEx: number;
};

export type UpsertMathRenderResult = {
  hash: string;
  inserted: boolean;
};

const FORBIDDEN_COMMANDS = new Set([
  "input",
  "include",
  "def",
  "newcommand",
  "renewcommand",
  "usepackage",
  "write",
  "catcode",
  "expandafter",
  "csname",
  "href",
]);

const ALLOWED_COMMANDS = new Set([
  "frac",
  "dfrac",
  "tfrac",
  "sqrt",
  "times",
  "div",
  "pm",
  "mp",
  "cdot",
  "le",
  "ge",
  "ne",
  "approx",
  "equiv",
  "propto",
  "infty",
  "pi",
  "theta",
  "alpha",
  "beta",
  "gamma",
  "lambda",
  "mu",
  "sigma",
  "Sigma",
  "Delta",
  "degree",
  "circ",
  "angle",
  "triangle",
  "parallel",
  "perp",
  "sin",
  "cos",
  "tan",
  "log",
  "ln",
  "exp",
  "sum",
  "overline",
  "vec",
  "overrightarrow",
  "hat",
  "mathbf",
  "text",
  "mathrm",
  "left",
  "right",
  "cup",
  "cap",
  "subset",
  "subseteq",
  "in",
  "notin",
  "emptyset",
  "varnothing",
  "therefore",
  "because",
]);

const ALLOWED_ENVIRONMENTS = new Set(["pmatrix", "bmatrix", "array", "aligned"]);

const ESCAPED_SINGLE_CHAR_COMMANDS = new Set(["{", "}", "|", "&", "%", "_", "^"]);

const HTML_TAG_PATTERN = /<[a-zA-Z][^>]*>/;

let mathDocument: ReturnType<typeof mathjax.document> | undefined;
let mathAdaptor: ReturnType<typeof liteAdaptor> | undefined;

function getMathRenderer() {
  if (!mathDocument || !mathAdaptor) {
    mathAdaptor = liteAdaptor();
    RegisterHTMLHandler(mathAdaptor);
    const tex = new TeX({ packages: AllPackages });
    const svgOutput = new SVG({ fontCache: "none" });
    mathDocument = mathjax.document("", { InputJax: tex, OutputJax: svgOutput });
  }
  return { document: mathDocument, adaptor: mathAdaptor };
}

function readBracedArgument(latex: string, start: number): { value: string; nextIndex: number } | null {
  if (latex[start] !== "{") {
    return null;
  }

  let depth = 0;
  let value = "";
  for (let i = start; i < latex.length; i++) {
    const char = latex[i];
    if (char === "{") {
      depth += 1;
      if (depth > 1) {
        value += char;
      }
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return { value, nextIndex: i + 1 };
      }
      value += char;
    } else {
      value += char;
    }
  }

  return null;
}

function skipOptionalBracket(latex: string, start: number): number {
  let index = start;
  while (index < latex.length && /\s/.test(latex[index])) {
    index += 1;
  }
  if (latex[index] !== "[") {
    return index;
  }

  index += 1;
  while (index < latex.length && latex[index] !== "]") {
    index += 1;
  }
  if (latex[index] === "]") {
    index += 1;
  }
  return index;
}

export function validateLatex(latex: string): LatexValidationResult {
  if (latex.includes("\\@")) {
    return { ok: false, reason: "Forbidden \\@ sequence" };
  }

  if (HTML_TAG_PATTERN.test(latex)) {
    return { ok: false, reason: "Raw HTML is forbidden" };
  }

  for (let index = 0; index < latex.length; ) {
    if (latex[index] !== "\\") {
      index += 1;
      continue;
    }

    index += 1;
    if (index >= latex.length) {
      return { ok: false, reason: "Trailing backslash" };
    }

    if (latex[index] === "\\") {
      index += 1;
      continue;
    }

    if (!/[a-zA-Z]/.test(latex[index])) {
      const char = latex[index];
      index += 1;
      if (!ESCAPED_SINGLE_CHAR_COMMANDS.has(char)) {
        return { ok: false, reason: `Command \\${char} is not on the allowlist` };
      }
      continue;
    }

    let command = "";
    while (index < latex.length && /[a-zA-Z]/.test(latex[index])) {
      command += latex[index];
      index += 1;
    }

    if (FORBIDDEN_COMMANDS.has(command)) {
      return { ok: false, reason: `Forbidden command \\${command}` };
    }

    if (command === "begin" || command === "end") {
      while (index < latex.length && /\s/.test(latex[index])) {
        index += 1;
      }
      const envArg = readBracedArgument(latex, index);
      if (!envArg) {
        return { ok: false, reason: `\\${command} requires a braced environment name` };
      }
      if (!ALLOWED_ENVIRONMENTS.has(envArg.value)) {
        return { ok: false, reason: `Environment ${envArg.value} is not allowed` };
      }
      index = envArg.nextIndex;
      continue;
    }

    if (command === "sqrt") {
      index = skipOptionalBracket(latex, index);
      if (!ALLOWED_COMMANDS.has("sqrt")) {
        return { ok: false, reason: "Command \\sqrt is not on the allowlist" };
      }
      continue;
    }

    if (!ALLOWED_COMMANDS.has(command)) {
      return { ok: false, reason: `Command \\${command} is not on the allowlist` };
    }
  }

  return { ok: true };
}

function parseExAttribute(svg: string, attribute: "width" | "height"): number {
  const match = svg.match(new RegExp(`${attribute}="([0-9.]+)ex"`));
  if (!match) {
    throw new Error(`SVG missing ${attribute} in ex units`);
  }
  return Number.parseFloat(match[1]);
}

function parseDepthEx(svg: string): number {
  const match = svg.match(/vertical-align:\s*(-?[0-9.]+)ex/);
  if (!match) {
    return 0;
  }
  const value = Number.parseFloat(match[1]);
  return value < 0 ? Math.abs(value) : 0;
}

export function computeRenderHash(latex: string, style: MathRenderStyle): string {
  return createHash("sha256").update(`${latex}|${style}`).digest("hex");
}

export function renderLatexToSvg(latex: string, style: MathRenderStyle): RenderedMath {
  const validation = validateLatex(latex);
  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const { document, adaptor } = getMathRenderer();
  const node = document.convert(latex, { display: style === "display" });
  const svg = adaptor.innerHTML(node);

  if (!svg.includes("<svg")) {
    throw new Error("MathJax did not produce SVG output");
  }

  return {
    svg,
    widthEx: parseExAttribute(svg, "width"),
    heightEx: parseExAttribute(svg, "height"),
    depthEx: parseDepthEx(svg),
  };
}

export async function upsertMathRender(
  pool: Pool,
  latex: string,
  style: MathRenderStyle = "display",
): Promise<UpsertMathRenderResult> {
  const hash = computeRenderHash(latex, style);
  const rendered = renderLatexToSvg(latex, style);
  const byteSize = Buffer.byteLength(rendered.svg, "utf8");

  const result = await pool.query<{ hash: string }>(
    `
      insert into public.math_renders (
        hash,
        latex,
        style,
        svg,
        width_ex,
        height_ex,
        depth_ex,
        renderer_version,
        byte_size
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (hash) do nothing
      returning hash
    `,
    [
      hash,
      latex,
      style,
      rendered.svg,
      rendered.widthEx,
      rendered.heightEx,
      rendered.depthEx,
      RENDERER_VERSION,
      byteSize,
    ],
  );

  return {
    hash,
    inserted: result.rowCount === 1,
  };
}
