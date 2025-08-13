import { DataKind, DataProvider, DataTypeMap } from "arcaea-toolbelt-core/models";

export class WebDataProvider implements DataProvider {
  #cache = new Map<DataKind, any>();

  constructor(public base: string) {}

  async get<T extends DataKind>(kind: T): Promise<DataTypeMap[T]> {
    if (this.#cache.has(kind)) {
      return this.#cache.get(kind);
    }
    const response = await fetch(new URL(`./${kind}.json`, this.base));
    const data = response.json();
    this.#cache.set(kind, data);
    return data;
  }
}
