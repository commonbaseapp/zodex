import { ValueOf } from "type-fest";

type DistributeType<T> = T extends any ? { type: T } : never;

export type SzNumber = {
  type: "number";
  min?: number;
  max?: number;
  multipleOf?: number;
  int?: true;
  finite?: true;
};
export type SzBigInt = {
  type: "bigInt";
  min?: bigint;
  max?: bigint;
  multipleOf?: bigint;
};
type PlainPrimitiveTypeNames =
  | "string"
  | "boolean"
  | "nan"
  | "date"
  | "undefined"
  | "null"
  | "any"
  | "unknown"
  | "never"
  | "void";
export type SzPrimitive =
  | DistributeType<PlainPrimitiveTypeNames>
  | SzNumber
  | SzBigInt;
export type SzLiteral<T> = { type: "literal"; value: T };
export type SzArray<T extends SzType> = { type: "array"; element: T };
export type SzObject<T extends Record<string, SzType>> = {
  type: "object";
  properties: T;
};
export type SzUnion<Options extends SzType[]> = {
  type: "union";
  options: Options;
};
export type SzDiscriminatedUnion<
  Discriminator extends string,
  Options extends SzType[]
> = {
  type: "discriminatedUnion";
  discriminator: Discriminator;
  options: Options;
};
export type SzIntersection<Left extends SzType, Right extends SzType> = {
  type: "intersection";
  left: Left;
  right: Right;
};
export type SzTuple<Items extends SzType[]> = {
  type: "tuple";
  items: Items;
};
export type SzRecord<Key extends SzKey, Value extends SzType> = {
  type: "record";
  key: Key;
  value: Value;
};
export type SzMap<Key extends SzKey, Value extends SzType> = {
  type: "map";
  key: Key;
  value: Value;
};
export type SzSet<T extends SzType> = {
  type: "set";
  value: T;
};
export type SzFunction<Args extends SzType, Return extends SzType> = {
  type: "function";
  args: Args;
  returns: Return;
};
export type SzEnum<Values extends (string | number)[]> = {
  type: "enum";
  values: Values;
};
export type SzPromise<T extends SzType> = { type: "promise"; value: T };

// Modifiers
export type SzNullable = { isNullable: true };
export type SzOptional = { isOptional: true };
export type SzDefault<T> = { defaultValue: T };

// Conjunctions
export type SzKey = { type: "string" | "number" | "symbol" };
export type SzDefaultOrNullable = SzDefault<any> | SzNullable;

export type SzType = (
  | SzPrimitive
  | SzLiteral<any>
  | SzArray<any>
  | SzObject<any>
  | SzUnion<any>
  | SzDiscriminatedUnion<any, any>
  | SzIntersection<any, any>
  | SzTuple<any>
  | SzRecord<any, any>
  | SzMap<any, any>
  | SzSet<any>
  | SzEnum<any>
  | SzPromise<any>
) &
  Partial<SzNullable & SzOptional & SzDefault<any>>;

export type SzUnionize<T extends SzType> =
  | T
  | (T extends SzArray<infer T>
      ? SzUnionize<T>
      : T extends SzObject<infer Properties>
      ? SzUnionize<ValueOf<Properties>>
      : T extends SzUnion<infer Options>
      ? SzUnionize<Options[number]>
      : T extends SzDiscriminatedUnion<infer _D, infer Options>
      ? SzUnionize<Options[number]>
      : T extends SzIntersection<infer L, infer R>
      ? SzUnionize<L | R>
      : T extends SzTuple<infer Items>
      ? SzUnionize<Items[number]>
      : T extends SzRecord<infer _Key, infer Value>
      ? SzUnionize<Value>
      : T extends SzMap<infer _Key, infer Value>
      ? SzUnionize<Value>
      : T extends SzSet<infer T>
      ? SzUnionize<T>
      : T extends SzFunction<infer Args, infer Return>
      ? SzUnionize<Args | Return>
      : T extends SzPromise<infer Value>
      ? SzUnionize<Value>
      : never);
