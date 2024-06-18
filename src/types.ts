import { ValueOf } from "type-fest";

export type SzNumber = {
  id: number;
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
  id: number;
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
  "cuid",
  "cuid2",
  "ulid",
] as const);

export type SzString = {
  id: number;
  type: "string";
  coerce?: boolean;
  min?: number;
  max?: number;
  length?: number;
  startsWith?: string;
  endsWith?: string;
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
        kind: "datetime";
        offset?: true;
        precision?: number;
      }
    | {
        kind: typeof STRING_KINDS extends Set<infer T> ? T : never;
      }
  );

export type SzDate = {
  id: number;
  type: "date";
  coerce?: boolean;
  min?: number;
  max?: number;
};

export type SzBoolean = {
  id: number;
  type: "boolean";
  coerce?: boolean;
};
export type SzNaN = {
  id: number;
  type: "nan";
};
export type SzUndefined = {
  id: number;
  type: "undefined";
};
export type SzNull = {
  id: number;
  type: "null";
};
export type SzAny = {
  id: number;
  type: "any";
};
export type SzUnknown = {
  id: number;
  type: "unknown";
};
export type SzNever = {
  id: number;
  type: "never";
};
export type SzVoid = {
  id: number;
  type: "void";
};

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
  | SzVoid;

export type SzLiteral<T> = {
  id: number;
  type: "literal";
  value: T;
};
export type SzArray<T extends SzType = SzType> = {
  id: number;
  type: "array";
  element: T;
  minLength?: number;
  maxLength?: number;
};
export type SzObject<
  T extends Record<string, SzType> = Record<string, SzType>
> = {
  id: number;
  type: "object";
  properties: T;
};

export type SzUnion<Options extends [SzType, ...SzType[]] = [SzType]> = {
  id: number;
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
  id: number;
  type: "discriminatedUnion";
  discriminator: Discriminator;
  options: Options;
};
export type SzIntersection<
  Left extends SzType = SzType,
  Right extends SzType = SzType
> = {
  id: number;
  type: "intersection";
  left: Left;
  right: Right;
};
export type SzTuple<
  Items extends [SzType, ...SzType[]] | [] = [SzType, ...SzType[]] | []
> = {
  id: number;
  type: "tuple";
  items: Items;
  rest?: SzType;
};
export type SzRecord<
  Key extends SzKey = SzKey,
  Value extends SzType = SzType
> = {
  id: number;
  type: "record";
  key: Key;
  value: Value;
};
export type SzMap<Key extends SzKey, Value extends SzType> = {
  id: number;
  type: "map";
  key: Key;
  value: Value;
};
export type SzSet<T extends SzType = SzType> = {
  id: number;
  type: "set";
  value: T;
  minSize?: number;
  maxSize?: number;
};
export type SzFunction<Args extends SzTuple, Return extends SzType> = {
  id: number;
  type: "function";
  args: Args;
  returns: Return;
};
export type SzEnum<
  Values extends [string, ...string[]] = [string, ...string[]]
> = {
  id: number;
  type: "enum";
  values: Values;
};
export type SzPromise<T extends SzType = SzType> = {
  id: number;
  type: "promise";
  value: T;
};
export type SzLazy = {
  id: number;
  type: "lazy";
  schema: SzType;
};

// Add this section
export type SzRef = {
  id: number;
  type: "ref";
  ref: number;
};

// Modifiers
export type SzNullable = {
  id: number;
  isNullable: boolean;
};
export type SzOptional = {
  id: number;
  isOptional: boolean;
};
export type SzDefault<T> = {
  id: number;
  defaultValue: T;
};

// Conjunctions
export type SzKey = SzString | SzNumber;
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
  | SzLazy
  | SzRef
) & // Add this line
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
      : T extends SzLazy
      ? SzUnionize<T["schema"]>
      : never);
