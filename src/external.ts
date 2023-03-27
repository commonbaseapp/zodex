import { ValueOf } from "type-fest";
import {
  SzArray,
  SzDiscriminatedUnion,
  SzFunction,
  SzIntersection,
  SzMap,
  SzObject,
  SzPromise,
  SzRecord,
  SzSet,
  SzTuple,
  SzType,
  SzUnion,
} from "./types";

export { getDefaultValue } from "./default";
export { serialize } from "./serialize";
export type { Infer } from "./infer";
export * from "./types";
export { mapViews } from "./ui";

type KeysOfUnion<T> = T extends T ? keyof T : never;

export type SzPropertyKeysOf<T extends SzType> = KeysOfUnion<
  Extract<T, { type: "object" }>["properties"]
>;
