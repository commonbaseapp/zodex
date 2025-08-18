import { SzType } from "./types.js";

export * from "./dezerialize.js";
export * from "./zerialize.js";

export * from "./types.js";
export * from "./zod-types.js";

export type KeysOfUnion<T> = T extends T ? keyof T : never;
export type SzPropertyKeysOf<T extends SzType> = KeysOfUnion<
  Extract<T, { type: "object" }>["properties"]
>;
