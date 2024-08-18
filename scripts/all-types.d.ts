/// <reference path="../node_modules/typed-query-selector/shim.d.ts" />
type Indexed<T> = import("@arcaea-toolbelt/utils/collections.js").Indexed<T>;
type ArcaeaToolbeltMeta = import("@arcaea-toolbelt/models/misc.js").ArcaeaToolbeltMeta;
type SongData = import("@arcaea-toolbelt/models/music-play.js").SongData;
type Banner = import("@arcaea-toolbelt/models/assets.js").Banner;
type AssetsInfo = import("@arcaea-toolbelt/models/file.js").AssetsInfo;
type SongAssetsInfo = import("@arcaea-toolbelt/models/file.js").SongAssetsInfo;
type ArcaeaToolbeltGeneratorAPI = typeof import("@arcaea-toolbelt/services/generator-api");
type Alias = import("../src/tools/chart/shared.js").Alias;
interface APKResponse {
  url: string;
  version: string;
}
type PathLike = import("node:fs").PathLike;
type FileHandle = import("node:fs/promises").FileHandle;

type Chart = import("@arcaea-toolbelt/models/music-play.js").Chart;
type ChartOverride = import("@arcaea-toolbelt/models/music-play.js").ChartOverride;
interface WikiChartConstantItem {
  constant: number;
  old: boolean;
}

type WikiChartConstantJSON = Record<string, (WikiChartConstantItem | null)[]>;
type SongList = import("../src/tools/packed-data").SongList;
type PackList = import("../src/tools/packed-data").PackList;
type Pack = import("../src/tools/packed-data").Pack;
type Song = import("../src/tools/packed-data").Song;
type DifficultyChart = import("../src/tools/packed-data").Difficulty;
type ExtraSongData = import("../src/tools/chart/shared").ExtraSongData;
type CharacterD = import("@arcaea-toolbelt/models/character").CharacterData;
type CharacterFactors = import("@arcaea-toolbelt/models/character").CharacterFactors;
type ChartExpress = import("@arcaea-toolbelt/models/misc").ChartExpress;
type NotesAndConstantsJSON = ExtraSongData[];
type KeyFactor = [lv1: number | null, lv20: number | null, lv30: number | null];
type KeyFactors = {
  id: number;
  frag: KeyFactor;
  step: KeyFactor;
  over: KeyFactor;
};
interface JSONResource<T> {
  (): Promise<T>;
  url: URL;
}

interface ConstantChartJSONGenerateContext {
  items: { chart: DifficultyChart; song: Song }[];
  slst: SongList;
  oldCC: WikiChartConstantJSON;
  oldNotes: NotesAndConstantsJSON;
}
