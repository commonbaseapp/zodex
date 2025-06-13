import { ValueOf } from "type-fest";

export type SzNumber = {
  type: "number";
  coerce?: boolean;
  min?: number;
  max?: number;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  multipleOf?: number;
  format?: typeof NUMBER_FORMATS extends Set<infer T> ? T : never;
};
export type SzBigInt = {
  type: "bigInt";
  coerce?: boolean;
  min?: string;
  max?: string;
  minInclusive?: boolean;
  maxInclusive?: boolean;
  multipleOf?: string;
  format?: "int64" | "uint64";
};

export const NUMBER_FORMATS = new Set([
  "int32",
  "uint32",
  "float32",
  "float64",
  "safeint",
] as const);

export const STRING_KINDS = new Set([
  "url",
  "emoji",
  "nanoid",
  "cuid",
  "cuid2",
  "ulid",
  "date",
  "duration",
  "base64",
  "base64url",
  "guid",
  "xid",
  "ksuid",
  "json_string",
  "e164",
  "jwt",

  "ipv4",
  "ipv6",
  "cidrv4",
  "cidrv6",
  "e164",
  // "uuidv8", // In docs only
  // "ascii", // In docs only
  // "utf8", // In docs only
  // "lowercase", // Doesn't appear to have enough data to serialize
  // "uppercase", // Doesn't appear to have enough data to serialize
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
    | { kind: "cidr"; version?: "v4" | "v6" }
    | { kind: "uuid"; version?: "v4" | "v7" }
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
        kind: "email";
        pattern?: string;
        flags?: string;
      }
    | {
        kind: "jwt";
        algorithm?: string;
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
  minInclusive?: boolean;
  maxInclusive?: boolean;
};

export type SzTemplateLiteral = {
  type: "templateLiteral";
  parts: (string | SzType)[];
};

export type SzFile = {
  type: "file";
  min: number;
  max: number;
  mime: string[];
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
  | SzFile
  | SzUndefined
  | SzNull
  | SzAny
  | SzUnknown
  | SzNever
  | SzVoid
  | SzSymbol;

export type SzLiteral<T> = { type: "literal"; values: T };
export type SzArray<T extends SzType = SzType> = {
  type: "array";
  element: T;
  minLength?: number;
  maxLength?: number;
};
export type SzObject<
  T extends Record<string, SzType> = Record<string, SzType>,
  U extends SzType = SzType,
> = {
  type: "object";
  properties: T;
  unknownKeys?: "strict" | "strip" | "passthrough";
  catchall?: U;
};

export type SzUnion<Options extends [SzType, ...SzType[]] = [SzType]> = {
  type: "union";
  options: Options;
};
export type SzDiscriminatedUnionOption<Discriminator extends string> = SzObject<
  Record<string, SzType>
>;
export type SzDiscriminatedUnion<
  Discriminator extends string = string,
  Options extends readonly SzType[] = readonly SzType[],
> = {
  type: "discriminatedUnion";
  discriminator: Discriminator;
  options: Options;
};
export type SzIntersection<
  Left extends SzType = SzType,
  Right extends SzType = SzType,
> = {
  type: "intersection";
  left: Left;
  right: Right;
};
export type SzTuple<
  Items extends [SzType, ...SzType[]] | [] = [SzType, ...SzType[]] | [],
> = {
  type: "tuple";
  items: Items;
  rest?: SzType;
};
export type SzRecord<
  Key extends SzKey = SzKey,
  Value extends SzType = SzType,
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
export type SzEnum<
  Values extends Readonly<
    Record<string, import("zod/v4/core").util.EnumValue>
  > = Readonly<Record<string, import("zod/v4/core").util.EnumValue>>,
> = {
  type: "enum";
  values: Values;
};

export type SzPromise<T extends SzType = SzType> = {
  type: "promise";
  value: T;
};

export type SzCatch<T extends SzType = SzType> = {
  type: "catch";
  value: any;
  innerType: T;
};

export type SzPipe<T extends SzType = SzType, U extends SzType = SzType> = {
  type: "pipe";
  inner: T;
  outer: U;
};

export type SzTransform = {
  type: "transform";
  name: string;
};

// Modifiers
export type SzNullable = { isNullable: boolean };
export type SzOptional = { isOptional: boolean };
export type SzDefault<T> = { defaultValue: T };
export type SzDescription = { description: string };
export type SzReadonly = { readonly: boolean };

export type SzRef = { $ref: string };

export type SzChecks = {
  checks: { name: string }[];
};

export type SzExtras = Partial<
  SzNullable &
    SzOptional &
    SzDefault<any> &
    SzDescription &
    SzReadonly &
    SzChecks
>;

// Conjunctions
export type SzKey = (
  | SzString
  | SzNumber
  | SzSymbol
  | SzLiteral<string | number>
  | SzEnum<any>
) &
  SzExtras;
export type SzDefaultOrNullable = SzDefault<any> | SzNullable;

export type SzType = (
  | SzPrimitive
  | SzLiteral<any>
  | SzTemplateLiteral
  | SzArray<any>
  | SzObject<any, any>
  | SzUnion<any>
  | SzDiscriminatedUnion<any, any>
  | SzIntersection<any, any>
  | SzTuple<any>
  | SzRecord<any, any>
  | SzMap<any, any>
  | SzSet<any>
  | SzEnum<any>
  | SzPromise<any>
  | SzCatch<any>
  | SzPipe<any, any>
  | SzTransform
) &
  SzExtras;

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
                      : T extends SzPromise<infer Value>
                        ? SzUnionize<Value>
                        : never);
