export interface TerritoryOption {
  code: string;
  label: string;
}

/** Caribbean territories supported at sign-up (ISO 3166-1 alpha-2). */
export const TERRITORY_OPTIONS: TerritoryOption[] = [
  { code: "JM", label: "Jamaica" },
  { code: "TT", label: "Trinidad and Tobago" },
  { code: "BB", label: "Barbados" },
  { code: "GD", label: "Grenada" },
  { code: "LC", label: "Saint Lucia" },
  { code: "VC", label: "Saint Vincent and the Grenadines" },
  { code: "AG", label: "Antigua and Barbuda" },
  { code: "DM", label: "Dominica" },
  { code: "KN", label: "Saint Kitts and Nevis" },
  { code: "BS", label: "Bahamas" },
  { code: "GY", label: "Guyana" },
  { code: "BZ", label: "Belize" },
];

export const DEFAULT_TERRITORY = "JM";
