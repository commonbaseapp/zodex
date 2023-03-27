import { Merge, RequiredKeysOf, OptionalKeysOf } from "type-fest";

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
  SzFunction,
  SzEnum,
  SzCatch,
  SzPromise,
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

// Similar to z.infer but based on serialized types
export type Infer<T extends SzType> =
  | (T extends SzOptional ? undefined : never)
  | (T extends SzNullable ? null : never)
  | (T["type"] extends keyof PrimitiveTypes
      ? PrimitiveTypes[T["type"]]
      : T extends { type: "literal" }
      ? T["value"]
      : T extends SzArray<infer T>
      ? Infer<T>[]
      : T extends SzObject<infer Properties>
      ? Merge<
          { [Key in RequiredKeysOf<Properties>]: Infer<Properties[Key]> },
          { [Key in OptionalKeysOf<Properties>]?: Infer<Properties[Key]> }
        >
      : T extends SzUnion<infer Options>
      ? Infer<Options[number]>
      : T extends SzDiscriminatedUnion<infer _D, infer Options>
      ? Infer<Options[number]>
      : T extends SzIntersection<infer L, infer R>
      ? Infer<L> & Infer<R>
      : T extends SzTuple<infer Items>
      ? Infer<Items[number]>[]
      : T extends SzRecord<infer _Key, infer Value>
      ? Record<string, Infer<Value>>
      : T extends SzMap<infer _Key, infer Value>
      ? Record<string, Infer<Value>>
      : T extends SzSet<infer T>
      ? T[]
      : T extends SzFunction<infer Args, infer Return>
      ? (...args: Infer<Args>[]) => Infer<Return>
      : T extends SzEnum<infer Values>
      ? Values[number]
      : T extends SzCatch<infer _Value>
      ? unknown
      : T extends SzPromise<infer Value>
      ? Promise<Infer<Value>>
      : unknown);
