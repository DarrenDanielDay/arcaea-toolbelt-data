import { findNextElWhere, htmlDocument, initPageDocument, prepareDocument, wikiURL, arcaeaCNClient } from "./wiki-util";
import characters from "../data/characters.json";
import { ItemData } from "@arcaea-toolbelt/models/world-mode";
import { CharacterFactors } from "@arcaea-toolbelt/models/character";
import { CharacterData } from "@arcaea-toolbelt/models/character";
import { concurrently } from "@arcaea-toolbelt/utils/concurrent";

const wikiCharacterTable = wikiURL("搭档");

interface CharacterTableData {
  link: string;
  imgs: string[];
  name: string;
  variant: string | undefined;
  ref: (typeof characters)[number];
}

async function getWikiCharacterTable(): Promise<CharacterTableData[]> {
  await initPageDocument(wikiCharacterTable, arcaeaCNClient);
  const characterAnchor = htmlDocument.querySelector("#搭档列表")!;
  const tableDiv = findNextElWhere(characterAnchor.parentElement!, (node) => node.matches("div.ddtable"));
  if (!tableDiv) {
    throw new Error("搭档表格未找到");
  }
  let characterGrids = Array.from(tableDiv.querySelectorAll(".content > div > div"));
  const charTexts = new Set(characterGrids.map((g) => g.textContent));
  characterGrids = characterGrids.filter((g) => {
    if (charTexts.has(g.textContent)) {
      charTexts.delete(g.textContent);
      return true;
    }
    return false;
  });
  if (characterGrids.length !== characters.length) {
    throw new Error(`角色总数不一致，wiki:${characterGrids.length}，json:${characters.length}`);
  }
  const result: CharacterTableData[] = [];
  for (const grid of characterGrids) {
    const cell1 = grid.children[0]!;
    const link = cell1.querySelector("a")!;
    const imgs = Array.from(cell1.querySelectorAll("img"), (img) => img.src);
    const fullName = link.title;
    let [, name, , variant] = /([^（）]+)(（([^（）]+)）)?/.exec(fullName)!;
    if (!name) {
      throw new Error("名称格式未匹配");
    }
    const renames: [string, string][] = [
      // wiki上的音译是“丽”，修正为和官方一致用于匹配
      ["咲弥 & 伊丽莎白", "咲弥 & 伊莉莎白"],
      // 新的别名，没办法
      ["洞烛", "拉可弥拉"],
      ["哀寂", "尼尔"],
    ];
    const alias = renames.find((r) => r.some((n) => name?.includes(n)));
    const ref = characters.find((c) => {
      if (alias) {
        if (alias.every((n) => !c.display_name["zh-Hans"].includes(n))) {
          return false;
        }
      } else if (c.display_name["zh-Hans"] !== name) {
        return false;
      }
      return !variant || variant === c.variant?.["zh-Hans"];
    });
    if (!ref) {
      console.log({
        fullName,
        name,
        variant,
      });
      throw new Error(`${fullName} 未匹配`);
    }
    result.push({
      variant,
      name,
      imgs,
      link: link.href,
      ref,
    });
  }
  return result;
}

const defaultFactors: CharacterFactors = {
  frag: 0,
  over: 0,
  step: 0,
};
const factorCount = Object.keys(defaultFactors).length;
const groupRowCount = factorCount + 1;
function isFactor(key: string): key is keyof CharacterFactors {
  return key in defaultFactors;
}

export async function fetchWikiCharacterAndCharacterCoreItemData(): Promise<{
  characters: CharacterData[];
  cores: ItemData[];
}> {
  const tableData = await getWikiCharacterTable();
  const itemTable = htmlDocument.querySelector(`#mw-content-text > div.mw-parser-output > table:nth-child(69)`)!;
  const itemImgs = Array.from(itemTable.querySelectorAll("img"));
  const items = itemImgs.map<ItemData>((img) => {
    return {
      name: [...img.parentElement!.parentElement!.parentElement!.textContent!].filter((s) => s.trim()).join(""),
      img: img.src,
    };
  });

  const getOneCharacter = async (item: CharacterTableData): Promise<CharacterData> => {
    const { ref, imgs, link } = item;
    const html = await arcaeaCNClient.fetch(link).then((res) => res.text());
    prepareDocument(html, link);
    const characterDataSpan = htmlDocument.getElementById(".E6.90.AD.E6.A1.A3.E5.88.86.E7.BA.A7.E6.95.B0.E6.8D.AE");
    const table =
      characterDataSpan instanceof HTMLSpanElement
        ? findNextElWhere(characterDataSpan.parentElement!, (node) => node.matches("table.wikitable"))
        : htmlDocument.querySelector("table.wikitable");
    if (!(table instanceof HTMLTableElement)) {
      console.warn(`${ref.display_name["zh-Hans"]} id =${ref.character_id} 的能力值因子表格元素未找到`);
    }
    const levels: CharacterFactors[] = [];
    const sections = Array.from(table instanceof HTMLTableElement ? table.tBodies : []);

    for (const section of sections) {
      const rows = section.rows;
      if (rows.length % groupRowCount) {
        throw new Error(`行数应当是${groupRowCount}的倍数`);
      }
      for (let i = 0, groups = rows.length / groupRowCount; i < groups; i++) {
        const levelRow = rows[i * groupRowCount]!;
        for (let groupOffset = 1; groupOffset < groupRowCount; groupOffset++) {
          const dataRow = rows[i * groupRowCount + groupOffset]!;
          const dataCells = dataRow.cells;
          const factor = [...dataCells[0]!.textContent!]
            .filter((c) => /[a-z]/i.test(c))
            .join("")
            .toLowerCase();
          if (!isFactor(factor)) {
            throw new Error(`未知能力值因子 ${factor}`);
          }
          for (let col = 1, maxCol = levelRow.cells.length; col < maxCol; col++) {
            const level = +levelRow.cells[col]!.textContent!;
            if (!level) {
              throw new Error("角色等级错误");
            }
            const factors = (levels[level] ??= { ...defaultFactors });
            const value = dataCells[col]!.textContent!.trim();
            if (!value) {
              console.error(`等级 ${level} 的 ${factor} 无数据`);
            }
            factors[factor] = value ? +value : NaN;
          }
        }
      }
    }
    const variantEn = ref.variant?.en.trim();
    const variantZh = ref.variant?.["zh-Hans"].trim();
    const data: CharacterData = {
      id: ref.character_id,
      name: {
        en: ref.display_name.en + (variantEn ? ` (${variantEn})` : ""),
        zh: ref.display_name["zh-Hans"] + (variantZh ? `（${variantZh}）` : ""),
      },
      levels,
    };
    const can: CharacterData["can"] = {};
    if (imgs[1]) {
      can.awake = true;
    }
    // 对立和摩耶存在lost状态
    if (ref.character_id === 1 || ref.character_id === 71) {
      can.lost = true;
    }
    if (Object.keys(can).length) {
      data.can = can;
    }
    return data;
  };
  const charactersData: CharacterData[] = await concurrently(tableData, getOneCharacter, 6);
  return {
    characters: charactersData.sort((a, b) => a.id - b.id),
    cores: items,
  };
}

function getOtherItemsData(): ItemData[] {
  return [
    {
      name: "以太之滴",
      img: "https://wiki.arcaea.cn/images/thumb/0/00/Ether_Drop.png/40px-Ether_Drop.png",
    },
    {
      name: "次元结晶",
      img: "https://wiki.arcaea.cn/images/1/16/Core_bypass.png",
    },
  ];
}

export async function getCharacterData() {
  const { characters, cores } = await fetchWikiCharacterAndCharacterCoreItemData();
  const items = [...cores, ...getOtherItemsData()];
  return {
    characters,
    items,
  };
}
