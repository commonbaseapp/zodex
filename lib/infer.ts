import { RequiredKeysOf, OptionalKeysOf } from "type-fest";

import {
  SzType,
  SzOptional,
  SzNullable,
  SzArray,
  SzObject,
  SzUnion,
  SzDiscriminatedUnion,
  SzIntersection,
  SzTuple,
  SzRecord,
  SzMap,
  SzSet,
  SzEnum,
  SzPromise,
  SzRef,
} from "./types";

type PrimitiveTypes = {
  string: string;
  number: number;
  boolean: boolean;
  nan: number;
  date: Date;
  symbol: symbol;
  undefined: undefined;
  null: null;
  any: any;
  unknown: unknown;
  never: never;
  void: void;
};

type RequiredKeys<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends SzOptional ? never : K;
}[keyof T];
type OptionalKeys<T extends Record<string, any>> = {
  [K in keyof T]: T[K] extends SzOptional ? K : never;
}[keyof T];

// Similar to z.infer but based on serialized types
export type SzInfer<T extends SzType> =
  | (T extends SzOptional ? undefined : never)
  | (T extends SzNullable ? null : never)
  | (T["type"] extends keyof PrimitiveTypes
      ? PrimitiveTypes[T["type"]]
      : T extends { type: "literal" }
        ? T["values"]
        : T extends SzArray<infer T>
          ? SzInfer<T>[]
          : T extends SzObject<infer Properties>
            ? {
                [Key in RequiredKeys<Properties>]: SzInfer<Properties[Key]>;
              } & {
                [Key in OptionalKeys<Properties>]?: SzInfer<Properties[Key]>;
              }
            : T extends SzUnion<infer Options>
              ? SzInfer<Options[number]>
              : T extends SzDiscriminatedUnion<infer _D, infer Options>
                ? SzInfer<Options[number]>
                : T extends SzIntersection<infer L, infer R>
                  ? SzInfer<L> & SzInfer<R>
                  : T extends SzTuple<infer Items>
                    ? SzInfer<Items[number]>[]
                    : T extends SzRecord<infer _Key, infer Value>
                      ? Record<string, SzInfer<Value>>
                      : T extends SzMap<infer _Key, infer Value>
                        ? Record<string, SzInfer<Value>>
                        : T extends SzSet<infer T>
                          ? T[]
                          : T extends SzEnum<infer Values>
                            ? Values[string]
                            : T extends SzPromise<infer Value>
                              ? Promise<SzInfer<Value>>
                              : unknown);
