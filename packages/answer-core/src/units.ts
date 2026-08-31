import { normalise } from "./normalise.js";

const UNIT_ALIASES: Record<string, string[]> = {
  "cm^2": ["cm^2", "cm2", "cm²", "sq cm", "square cm"],
  "cm^3": ["cm^3", "cm3", "cm³", "cubic cm"],
  "mm^2": ["mm^2", "mm2", "mm²", "sq mm", "square mm"],
};

/** Conversion factors to canonical unit (value in canonical = value in from * factor). */
const CONVERSION_TO_CANONICAL: Record<string, Record<string, number>> = {
  "cm^2": { "mm^2": 100 },
  "mm^2": { "cm^2": 0.01 },
};

export function canonicaliseUnit(unit: string): string {
  const profile = { profile: "units_default" as const };
  const normalised = normalise(unit, profile);
  for (const [canonical, aliases] of Object.entries(UNIT_ALIASES)) {
    const lower = normalised.toLowerCase();
    if (lower === canonical.toLowerCase()) {
      return canonical;
    }
    for (const alias of aliases) {
      if (lower === alias.toLowerCase()) {
        return canonical;
      }
    }
  }
  return normalised;
}

export function unitsMatch(
  inputUnit: string,
  canonical: string | null,
  acceptedSet: string[],
): boolean {
  const inputCanonical = canonicaliseUnit(inputUnit);
  if (canonical && inputCanonical === canonicaliseUnit(canonical)) {
    return true;
  }
  for (const accepted of acceptedSet) {
    if (inputCanonical === canonicaliseUnit(accepted)) {
      return true;
    }
  }
  return false;
}

export function convertUnitValue(
  value: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  const from = canonicaliseUnit(fromUnit);
  const to = canonicaliseUnit(toUnit);
  if (from === to) {
    return value;
  }
  const fromFactors = CONVERSION_TO_CANONICAL[from];
  if (fromFactors && fromFactors[to] !== undefined) {
    return value * fromFactors[to]!;
  }
  return null;
}

export function normaliseUnitToken(unit: string): string {
  return canonicaliseUnit(unit);
}
