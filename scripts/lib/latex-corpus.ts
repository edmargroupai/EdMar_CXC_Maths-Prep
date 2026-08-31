export type LatexCorpusEntry = {
  latex: string;
  style: "inline" | "display";
  category:
    | "number_theory"
    | "algebra"
    | "geometry"
    | "trigonometry"
    | "sets"
    | "matrices"
    | "statistics";
};

function buildUniqueCorpus(): LatexCorpusEntry[] {
  const entries: LatexCorpusEntry[] = [];

  for (let n = 1; n <= 30; n += 1) {
    entries.push({
      category: "number_theory",
      style: n % 2 === 0 ? "inline" : "display",
      latex: `\\frac{${n}}{${n + 1}} + \\frac{${n + 2}}{${n + 3}} = \\frac{${n * (n + 3) + (n + 2) * (n + 1)}}{${(n + 1) * (n + 3)}}`,
    });
  }

  for (let n = 1; n <= 35; n += 1) {
    entries.push({
      category: "algebra",
      style: n % 3 === 0 ? "inline" : "display",
      latex: `x^${n} + ${n}x + ${n * 2} = 0`,
    });
  }

  for (let n = 1; n <= 28; n += 1) {
    entries.push({
      category: "geometry",
      style: n % 2 === 1 ? "inline" : "display",
      latex: `\\angle ABC = ${30 + n}^\\circ, a^2 + b^2 = c^2`,
    });
  }

  for (let n = 1; n <= 30; n += 1) {
    entries.push({
      category: "trigonometry",
      style: n % 4 === 0 ? "inline" : "display",
      latex: `\\sin(${n}^\\circ) = \\frac{${n}}{${n + 10}}, \\cos^2\\theta + \\sin^2\\theta = 1`,
    });
  }

  for (let n = 1; n <= 25; n += 1) {
    entries.push({
      category: "sets",
      style: n % 2 === 0 ? "inline" : "display",
      latex: `A \\cup B = \\{${n}, ${n + 1}, ${n + 2}\\}, x \\in A \\cap B`,
    });
  }

  for (let n = 1; n <= 20; n += 1) {
    entries.push({
      category: "matrices",
      style: "display",
      latex: `\\begin{pmatrix} ${n} & ${n + 1} \\\\ ${n + 2} & ${n + 3} \\end{pmatrix}`,
    });
  }

  for (let n = 1; n <= 26; n += 1) {
    entries.push({
      category: "statistics",
      style: n % 3 === 0 ? "inline" : "display",
      latex: `\\overline{x} = \\frac{${n * 10}}{${n}}, P(A) = \\frac{${n}}{${n + 100}}`,
    });
  }

  if (entries.length !== 194) {
    throw new Error(`Expected 194 unique corpus entries, got ${entries.length}`);
  }

  return entries;
}

const uniqueCorpus = buildUniqueCorpus();

/** Deliberate repeats for dedup testing — six entries appear twice (200 total, 194 distinct). */
const duplicateEntries = uniqueCorpus.slice(0, 6).map((entry) => ({ ...entry }));

export const LATEX_CORPUS: readonly LatexCorpusEntry[] = Object.freeze([
  ...uniqueCorpus,
  ...duplicateEntries,
]);

export const LATEX_CORPUS_SIZE = LATEX_CORPUS.length;

export const LATEX_CORPUS_UNIQUE_SIZE = uniqueCorpus.length;
