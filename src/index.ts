import { SzType } from "./types";

export * from "./dezerialize";
export * from "./zerialize";

export * from "./types";

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type SzPropertyKeysOf<T extends SzType> = KeysOfUnion<
  Extract<T, { type: "object" }>["properties"]
>;
