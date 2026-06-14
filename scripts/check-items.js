import { isMain } from "pragmatism";
import { itemDataFile, itemsFile } from "./files.js";

export async function checkItems() {
  const items = await itemsFile();
  const itemData = await itemDataFile();

  const itemsGroup = Map.groupBy(items, (item) => item.name.zh);
  let success = true;
  for (const item of itemData) {
    if (!itemsGroup.has(item.name)) {
      console.error(`Missing item in ${itemsFile.url}: ${item.name}`);
      success = false;
    }
  }
  return success;
}

if (isMain(import.meta.url)) {
  if (await checkItems()) {
    console.log(`OK`);
  } else {
    console.log(`Check failed.`);
  }
}
