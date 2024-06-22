import { ValueOf } from "type-fest";

export type SzNumber = {
  type: "number";
  coerce?: boolean;
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  multipleOf?: number;
  int?: boolean;
  finite?: boolean;
};
export type SzBigInt = {
  type: "bigInt";
  coerce?: boolean;
  min?: string;
  max?: string;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  multipleOf?: string;
};

export const STRING_KINDS = new Set([
  "email",
  "url",
  "emoji",
  "uuid",
  "nanoid",
  "cuid",
  "cuid2",
  "ulid",
  "date",
  "duration",
  "base64",
] as const);

export type SzString = {
  type: "string";
  coerce?: boolean;
  min?: number;
  max?: number;
  length?: number;
  startsWith?: string;
  endsWith?: string;
  toLowerCase?: boolean;
  toUpperCase?: boolean;
  trim?: boolean;
} & (
  | object
  | {
      includes: string;
      position?: number;
    }
) &
  (
    | object
    | { kind: "ip"; version?: "v4" | "v6" }
    | { regex: string; flags?: string }
    | {
        kind: "time";
        precision?: number;
      }
    | {
        kind: "datetime";
        offset?: true;
        local?: true;
        precision?: number;
      }
    | {
        kind: typeof STRING_KINDS extends Set<infer T> ? T : never;
      }
  );

export type SzDate = {
  type: "date";
  coerce?: boolean;
  min?: number;
  max?: number;
};

export type SzBoolean = { type: "boolean"; coerce?: boolean };
export type SzNaN = { type: "nan" };
export type SzUndefined = { type: "undefined" };
export type SzNull = { type: "null" };
export type SzAny = { type: "any" };
export type SzUnknown = { type: "unknown" };
export type SzNever = { type: "never" };
export type SzVoid = { type: "void" };
export type SzSymbol = { type: "symbol" };

export type SzPrimitive =
  | SzBoolean
  | SzNumber
  | SzBigInt
  | SzString
  | SzNaN
  | SzDate
  | SzUndefined
  | SzNull
  | SzAny
  | SzUnknown
  | SzNever
  | SzVoid
  | SzSymbol;

export type SzLiteral<T> = { type: "literal"; value: T };
export type SzArray<T extends SzType = SzType> = {
  type: "array";
  element: T;
  minLength?: number;
  maxLength?: number;
};
export type SzObject<
  T extends Record<string, SzType> = Record<string, SzType>
> = {
  type: "object";
  properties: T;
  unknownKeys?: "strict" | "strip" | "passthrough";
};

export type SzUnion<Options extends [SzType, ...SzType[]] = [SzType]> = {
  type: "union";
  options: Options;
};
export type SzDiscriminatedUnionOption<Discriminator extends string> = {
  [key in Discriminator]: SzType;
} & SzType;
export type SzDiscriminatedUnion<
  Discriminator extends string = string,
  Options extends SzDiscriminatedUnionOption<Discriminator>[] = []
> = {
  type: "discriminatedUnion";
  discriminator: Discriminator;
  options: Options;
};
export type SzIntersection<
  Left extends SzType = SzType,
  Right extends SzType = SzType
> = {
  type: "intersection";
  left: Left;
  right: Right;
};
export type SzTuple<
  Items extends [SzType, ...SzType[]] | [] = [SzType, ...SzType[]] | []
> = {
  type: "tuple";
  items: Items;
  rest?: SzType;
};
export type SzRecord<
  Key extends SzKey = SzKey,
  Value extends SzType = SzType
> = {
  type: "record";
  key: Key;
  value: Value;
};
export type SzMap<Key extends SzKey, Value extends SzType> = {
  type: "map";
  key: Key;
  value: Value;
};
export type SzSet<T extends SzType = SzType> = {
  type: "set";
  value: T;
  minSize?: number;
  maxSize?: number;
};
export type SzFunction<Args extends SzTuple, Return extends SzType> = {
  type: "function";
  args: Args;
  returns: Return;
};
export type SzEnum<
  Values extends [string, ...string[]] = [string, ...string[]]
> = {
  type: "enum";
  values: Values;
};
export type SzPromise<T extends SzType = SzType> = {
  type: "promise";
  value: T;
};

export type SzEffect<T extends SzType = SzType> = {
  type: "effect";
  effects: {
    name: string;
    type: "refinement" | "transform" | "preprocess";
  }[];
  inner: T;
};

// Modifiers
export type SzNullable = { isNullable: boolean };
export type SzOptional = { isOptional: boolean };
export type SzDefault<T> = { defaultValue: T };
export type SzDescription = { description: string };
export type SzReadonly = { readonly: boolean };

export type SzRef = { $ref: string };

// Conjunctions
export type SzKey = SzString | SzNumber | SzSymbol;
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
  | SzFunction<any, any>
  | SzEnum<any>
  | SzPromise<any>
  | SzEffect<any>
) &
  Partial<
    SzNullable & SzOptional & SzDefault<any> & SzDescription & SzReadonly
  >;

export type SzUnionize<T extends SzType | SzRef> =
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
