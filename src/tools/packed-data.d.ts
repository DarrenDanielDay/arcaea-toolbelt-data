interface SongList {
  songs: Song[];
}

interface Song {
  idx: number;
  id: string;
  title_localized?: Titlelocalized;
  artist?: string;
  search_title?: Searchtitle;
  search_artist?: Searchtitle;
  bpm?: string;
  bpm_base?: number;
  set?: string;
  purchase?: string;
  audioPreview?: number;
  audioPreviewEnd?: number;
  side?: number;
  bg?: string;
  bg_inverse?: string;
  date?: number;
  version?: string;
  difficulties?: Difficulty[];
  world_unlock?: boolean;
  remote_dl?: boolean;
  category?: string;
  source_localized?: Sourcelocalized;
  source_copyright?: string;
  no_stream?: boolean;
  jacket_localized?: Jacketlocalized;
  deleted?: boolean;
  bg_daynight?: Bgdaynight;
  byd_local_unlock?: boolean;
  additional_files?: Additionalfile[];
  songlist_hidden?: boolean;
  limitedSaleEndTime?: number;
}

interface Additionalfile {
  file_name: string;
  requirement: string;
}

interface Bgdaynight {
  day: string;
  night: string;
}

interface Jacketlocalized {
  ja: boolean;
}

interface Sourcelocalized {
  en: string;
  ja?: string;
}

interface Difficulty {
  ratingClass: number;
  chartDesigner: string;
  jacketDesigner: string;
  rating: number;
  date?: number;
  version?: string;
  jacketOverride?: boolean;
  ratingPlus?: boolean;
  bg?: string;
  bg_inverse?: string;
  hidden_until?: string;
  title_localized?: Titlelocalized2;
  audioOverride?: boolean;
  legacy11?: boolean;
  plusFingers?: boolean;
  artist?: string;
  bpm?: string;
  bpm_base?: number;
  jacket_night?: string;
  hidden_until_unlocked?: boolean;
  world_unlock?: boolean;
}

interface Titlelocalized2 {
  en: string;
}

interface Searchtitle {
  ja?: string[];
  ko: string[];
  en?: string[];
}

interface Titlelocalized {
  en: string;
  ko?: string;
  "zh-Hant"?: string;
  "zh-Hans"?: string;
  ja?: string;
  kr?: string;
  ko_dialog?: string;
}

interface PackList {
  packs: Pack[];
}

interface Pack {
  id: string;
  section: string;
  plus_character: number;
  custom_banner?: boolean;
  cutout_pack_image?: boolean;
  name_localized: Namelocalized;
  description_localized: Descriptionlocalized;
  is_extend_pack?: boolean;
  is_active_extend_pack?: boolean;
  small_pack_image?: boolean;
  pack_parent?: string;
  limitedSaleEndTime?: number;
}

interface Descriptionlocalized {
  en: string;
  ja: string;
  ko?: string;
  "zh-Hant"?: string;
  "zh-Hans"?: string;
}

interface Namelocalized {
  en: string;
}

export { Additionalfile, Bgdaynight, Difficulty, Song, SongList, Pack, PackList };
