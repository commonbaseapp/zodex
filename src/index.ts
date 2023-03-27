import { SzType } from "./types";

export { getDefaultValue } from "./default";
export { zerialize } from "./zerialize";
export type { SzInfer } from "./infer";
export * from "./types";
export { mapTypesToViews } from "./ui";

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type SzPropertyKeysOf<T extends SzType> = KeysOfUnion<
  Extract<T, { type: "object" }>["properties"]
>;
