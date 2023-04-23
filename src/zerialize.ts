import { z } from "zod";
import {
  SzOptional,
  SzNullable,
  SzDefault,
  SzLiteral,
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
  SzPromise,
  SzPrimitive,
  SzNumber,
} from "./types";

export const PRIMITIVES = {
  ZodString: "string",
  ZodNumber: "number",
  ZodBoolean: "boolean",
  ZodNaN: "nan",
  ZodBigInt: "bigInt",
  ZodDate: "date",
  ZodUndefined: "undefined",
  ZodNull: "null",
  ZodAny: "any",
  ZodUnknown: "unknown",
  ZodNever: "never",
  ZodVoid: "void",
} as const satisfies Readonly<
  Partial<
    Record<Exclude<z.ZodFirstPartyTypeKind, "ZodSymbol">, SzPrimitive["type"]>
  >
>;
export type PrimitiveMap = typeof PRIMITIVES;

// Zod Type helpers
type Schema = z.ZodFirstPartySchemaTypes;
type TypeName<T extends Schema> = T["_def"]["typeName"];

type IsZodPrimitive<T extends Schema> = TypeName<T> extends keyof PrimitiveMap
  ? any
  : never;

type ZerializeArray<Items extends Schema[]> = {
  [Index in keyof Items]: Zerialize<Items[Index]>;
};

// Types must match the exported zerialize function's implementation
export type Zerialize<T extends Schema> =
  // Modifier types
  T extends z.ZodOptional<infer I>
    ? Zerialize<I> & SzOptional
    : T extends z.ZodNullable<infer I>
    ? Zerialize<I> & SzNullable
    : T extends z.ZodDefault<infer I>
    ? Zerialize<I> & SzDefault<I["_type"]>
    : // Primitives
    T extends z.ZodNumber
    ? SzNumber
    : T extends IsZodPrimitive<T>
    ? {
        type: (typeof PRIMITIVES)[TypeName<T>];
      }
    : //
    T extends z.ZodLiteral<infer Value>
    ? SzLiteral<Value>
    : // List Collections
    T extends z.ZodTuple<infer Items>
    ? SzTuple<ZerializeArray<[...Items]>>
    : T extends z.ZodSet<infer T>
    ? SzSet<Zerialize<T>>
    : T extends z.ZodArray<infer T>
    ? SzArray<Zerialize<T>>
    : // Key/Value Collections
    T extends z.ZodObject<infer Properties>
    ? SzObject<{
        [Property in keyof Properties]: Zerialize<Properties[Property]>;
      }>
    : T extends z.ZodRecord<infer Key, infer Value>
    ? SzRecord<Zerialize<Key>, Zerialize<Value>>
    : T extends z.ZodMap<infer Key, infer Value>
    ? SzMap<Zerialize<Key>, Zerialize<Value>>
    : // Enums
    T extends z.ZodEnum<infer Values>
    ? SzEnum<Values>
    : T extends z.ZodNativeEnum<infer _Values>
    ? { type: "unknown" }
    : // Union/Intersection
    T extends z.ZodUnion<infer Options>
    ? SzUnion<ZerializeArray<[...Options]>>
    : T extends z.ZodDiscriminatedUnion<infer Discriminator, infer Options>
    ? SzDiscriminatedUnion<Discriminator, ZerializeArray<Options>>
    : T extends z.ZodIntersection<infer L, infer R>
    ? SzIntersection<Zerialize<L>, Zerialize<R>>
    : // Specials
    T extends z.ZodFunction<infer Args, infer Return>
    ? SzFunction<Zerialize<Args>, Zerialize<Return>>
    : T extends z.ZodPromise<infer Value>
    ? SzPromise<Zerialize<Value>>
    : // Unserializable types, fallback to serializing an inner type
    T extends z.ZodLazy<infer T>
    ? Zerialize<T>
    : T extends z.ZodEffects<infer T>
    ? Zerialize<T>
    : T extends z.ZodBranded<infer T, infer _Brand>
    ? Zerialize<T>
    : T extends z.ZodPipeline<infer _In, infer Out>
    ? Zerialize<Out>
    : T extends z.ZodCatch<infer Inner>
    ? Zerialize<Inner>
    : unknown;

type ZodTypeMap = {
  [Key in TypeName<Schema>]: Extract<Schema, { _def: { typeName: Key } }>;
};
type ZerializersMap = {
  [Key in TypeName<Schema>]: (
    def: ZodTypeMap[Key]["_def"]
  ) => Zerialize<ZodTypeMap[Key]>;
};

const STRING_KINDS = new Set([
  "email",
  "url",
  "emoji",
  "uuid",
  "cuid",
  "cuid2",
  "ulid",
]);

const zerializers = {
  ZodOptional: (def) => ({ ...zerialize(def.innerType), isOptional: true }),
  ZodNullable: (def) => ({ ...zerialize(def.innerType), isNullable: true }),
  ZodDefault: (def) => ({
    ...zerialize(def.innerType),
    defaultValue: def.defaultValue(),
  }),

  ZodNumber: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? {
              min: check.value,
              ...(check.inclusive ? { minInclusive: true } : {}),
            }
          : check.kind == "max"
          ? {
              max: check.value,
              ...(check.inclusive ? { maxInclusive: true } : {}),
            }
          : check.kind == "multipleOf"
          ? { multipleOf: check.value }
          : check.kind == "int"
          ? { int: true }
          : check.kind == "finite"
          ? { finite: true }
          : {}),
      }),
      {}
    );
    return { type: "number", ...checks };
  },
  ZodString: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? { min: check.value }
          : check.kind == "max"
          ? { max: check.value }
          : check.kind == "length"
          ? { length: check.value }
          : check.kind == "startsWith"
          ? { startsWith: check.value }
          : check.kind == "endsWith"
          ? { endsWith: check.value }
          : check.kind == "includes"
          ? { includes: check.value, position: check.position }
          : check.kind == "regex"
          ? {
              regex: check.regex.source,
              ...(check.regex.flags ? { flags: check.regex.flags } : {}),
            }
          : check.kind == "ip"
          ? { kind: "ip", version: check.version }
          : check.kind == "datetime"
          ? {
              kind: "datetime",
              ...(check.offset ? { offset: check.offset } : {}),
              ...(typeof check.precision === "number"
                ? { precision: check.precision }
                : {}),
            }
          : STRING_KINDS.has(check.kind)
          ? { kind: check.kind }
          : {}),
      }),
      {}
    );
    return { type: "string", ...checks };
  },
  ZodBoolean: () => ({ type: "boolean" }),
  ZodNaN: () => ({ type: "nan" }),
  ZodBigInt: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? {
              min: check.value,
              ...(check.inclusive ? { minInclusive: true } : {}),
            }
          : check.kind == "max"
          ? {
              max: check.value,
              ...(check.inclusive ? { maxInclusive: true } : {}),
            }
          : check.kind == "multipleOf"
          ? { multipleOf: check.value }
          : {}),
      }),
      {}
    );
    return { type: "bigInt", ...checks };
  },
  ZodDate: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? { min: check.value }
          : check.kind == "max"
          ? { max: check.value }
          : {}),
      }),
      {}
    );
    return { type: "date", ...checks };
  },
  ZodUndefined: () => ({ type: "undefined" }),
  ZodNull: () => ({ type: "null" }),
  ZodAny: () => ({ type: "any" }),
  ZodUnknown: () => ({ type: "unknown" }),
  ZodNever: () => ({ type: "never" }),
  ZodVoid: () => ({ type: "void" }),

  ZodLiteral: (def) => ({ type: "literal", value: def.value }),

  ZodTuple: (def) => ({
    type: "tuple",
    items: def.items.map(zerialize),
    ...(def.rest
      ? {
          rest: zerialize(def.rest),
        }
      : {}),
  }),
  ZodSet: (def) => ({
    type: "set",
    value: zerialize(def.valueType),
    ...(def.minSize === null ? {} : { minSize: def.minSize.value }),
    ...(def.maxSize === null ? {} : { maxSize: def.maxSize.value }),
  }),
  ZodArray: (def) => ({
    type: "array",
    element: zerialize(def.type),

    ...(def.exactLength === null
      ? {}
      : {
          minLength: def.exactLength.value,
          maxLength: def.exactLength.value,
        }),
    ...(def.minLength === null ? {} : { minLength: def.minLength.value }),
    ...(def.maxLength === null ? {} : { maxLength: def.maxLength.value }),
  }),

  ZodObject: (def) => ({
    type: "object",
    properties: Object.fromEntries(
      Object.entries(def.shape()).map(([key, value]) => [
        key,
        zerialize(value as Schema),
      ])
    ),
  }),
  ZodRecord: (def) => ({
    type: "record",
    key: zerialize(def.keyType),
    value: zerialize(def.valueType),
  }),
  ZodMap: (def) => ({
    type: "map",
    key: zerialize(def.keyType),
    value: zerialize(def.valueType),
  }),

  ZodEnum: (def) => ({ type: "enum", values: def.values }),
  // TODO: turn into enum
  ZodNativeEnum: () => ({ type: "unknown" }),

  ZodUnion: (def) => ({
    type: "union",
    options: def.options.map(zerialize),
  }),
  ZodDiscriminatedUnion: (def) => ({
    type: "discriminatedUnion",
    discriminator: def.discriminator,
    options: def.options.map(zerialize),
  }),
  ZodIntersection: (def) => ({
    type: "intersection",
    left: zerialize(def.left),
    right: zerialize(def.right),
  }),

  ZodFunction: (def) => ({
    type: "function",
    args: zerialize(def.args),
    returns: zerialize(def.returns),
  }),
  ZodPromise: (def) => ({ type: "promise", value: zerialize(def.type) }),

  ZodLazy: (def) => zerialize(def.getter()),
  ZodEffects: (def) => zerialize(def.schema),
  ZodBranded: (def) => zerialize(def.type),
  ZodPipeline: (def) => zerialize(def.out),
  ZodCatch: (def) => zerialize(def.innerType),
} satisfies ZerializersMap as ZerializersMap;

// Must match the exported Zerialize types
export function zerialize<T extends Schema>(_schema: T): Zerialize<T>;
export function zerialize(schema: Schema): unknown {
  const { _def: def } = schema;
  return zerializers[def.typeName](def as any);
}
