export interface ExtraSongData {
  id: string;
  // lasteternity，仅有etr难度但没有byd难度的会有null
  charts: (null | ChartNotesAndConstant)[];
}

export interface ChartNotesAndConstant {
  notes: number;
  constant: number;
}

export interface Alias {
  id: string;
  alias: string[];
}
