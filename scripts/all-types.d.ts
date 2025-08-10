/// <reference path="../node_modules/typed-query-selector/shim.d.ts" />
type Indexed<T> = import("@arcaea-toolbelt/utils/collections.js").Indexed<T>;
type ArcaeaToolbeltGeneratorAPI = typeof import("@arcaea-toolbelt/services/generator-api");
type ArcaeaToolbeltMeta = import("arcaea-toolbelt-core/models").ArcaeaToolbeltMeta;
type SongData = import("arcaea-toolbelt-core/models").mini.SongData;
type CourseBanner = import("arcaea-toolbelt-core/models").CourseBanner;
type Banner = import("arcaea-toolbelt-core/models").Banner;
type ItemData = import("arcaea-toolbelt-core/models").ItemData;
type AssetsInfo = import("arcaea-toolbelt-core/models").AssetsInfo;
type SongAssetsInfo = import("arcaea-toolbelt-core/models").SongAssetsInfo;
type Alias = import("arcaea-toolbelt-core/models").Alias;
interface APKResponse {
  url: string;
  version: string;
}
type PathLike = import("node:fs").PathLike;
type FileHandle = import("node:fs/promises").FileHandle;

type Chart = import("arcaea-toolbelt-core/models").mini.Chart;
type ChartOverride = import("arcaea-toolbelt-core/models").mini.ChartOverride;
interface WikiChartConstantItem {
  constant: number;
  old: boolean;
}

declare namespace wiki {
  type ChartConstant = Record<string, (WikiChartConstantItem | null)[]>;
  type ChartNotes = Record<string, (number | null)[]>;
}
type SongList = import("arcaea-toolbelt-core/models").$616.SongList;
type PackList = import("arcaea-toolbelt-core/models").$616.PackList;
type Pack = import("arcaea-toolbelt-core/models").$616.Pack;
type Song = import("arcaea-toolbelt-core/models").$616.Song;
type DifficultyChart = import("arcaea-toolbelt-core/models").$616.Difficulty;
type ExtraSongData = import("../src/tools/chart/shared").ExtraSongData;
type CharacterD = import("arcaea-toolbelt-core/models").CharacterData;
type CharacterFactors = import("arcaea-toolbelt-core/models").CharacterFactors;
type ChartExpress = import("arcaea-toolbelt-core/models").ChartExpress;
type PatchedSongList = import("arcaea-toolbelt-core/models").PatchedSongList;
type SongExtraData = import("arcaea-toolbelt-core/models").SongExtraData;
type NotesAndConstantsJSON = ExtraSongData[];
type KeyFactor = import("arcaea-toolbelt-core/models").KeyFactor;
type KeyFactors = import("arcaea-toolbelt-core/models").KeyFactors;
interface JSONResource<T> {
  (): Promise<T>;
  url: URL;
}

interface ConstantChartJSONGenerateContext {
  items: { chart: DifficultyChart; song: Song }[];
  slst: SongList;
  oldCC: wiki.ChartConstant;
  oldNotes: NotesAndConstantsJSON;
}
