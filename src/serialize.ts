import { Merge } from "type-fest";
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
  SzCatch,
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
  ZodSymbol: "symbol",
  ZodUndefined: "undefined",
  ZodNull: "null",
  ZodAny: "any",
  ZodUnknown: "unknown",
  ZodNever: "never",
  ZodVoid: "void",
} as const satisfies Readonly<
  Partial<Record<z.ZodFirstPartyTypeKind, SzPrimitive["type"]>>
>;
export type PrimitiveMap = typeof PRIMITIVES;

// Zod Type helpers
type Schema = z.ZodFirstPartySchemaTypes;
type TypeName<T extends Schema> = T["_def"]["typeName"];

type IsZodPrimitive<T extends Schema> = TypeName<T> extends keyof PrimitiveMap
  ? any
  : never;

type SerializeArray<Items extends Schema[]> = {
  [Index in keyof Items]: Serialize<Items[Index]>;
};
// Types must match the exported serialize function's implementation
export type Serialize<T extends Schema> = T extends z.ZodOptional<infer I>
  ? Merge<Serialize<I>, SzOptional>
  : T extends z.ZodNullable<infer I>
  ? Merge<Serialize<I>, SzNullable>
  : T extends z.ZodDefault<infer I>
  ? Merge<Serialize<I>, SzDefault<I["_type"]>>
  : T extends z.ZodNumber
  ? SzNumber
  : T extends IsZodPrimitive<T>
  ? {
      type: (typeof PRIMITIVES)[TypeName<T>];
    }
  : T extends z.ZodLiteral<infer Value>
  ? SzLiteral<Value>
  : T extends z.ZodArray<infer T>
  ? SzArray<Serialize<T>>
  : T extends z.ZodObject<infer Properties>
  ? SzObject<{
      [Property in keyof Properties]: Serialize<Properties[Property]>;
    }>
  : T extends z.ZodUnion<infer Options>
  ? SzUnion<SerializeArray<[...Options]>>
  : T extends z.ZodDiscriminatedUnion<infer Discriminator, infer Options>
  ? SzDiscriminatedUnion<Discriminator, SerializeArray<Options>>
  : T extends z.ZodIntersection<infer L, infer R>
  ? SzIntersection<Serialize<L>, Serialize<R>>
  : T extends z.ZodTuple<infer Items>
  ? SzTuple<SerializeArray<[...Items]>>
  : T extends z.ZodRecord<infer Key, infer Value>
  ? SzRecord<Serialize<Key>, Serialize<Value>>
  : T extends z.ZodMap<infer Key, infer Value>
  ? SzMap<Serialize<Key>, Serialize<Value>>
  : T extends z.ZodSet<infer T>
  ? SzSet<Serialize<T>>
  : T extends z.ZodFunction<infer Args, infer Return>
  ? SzFunction<Serialize<Args>, Serialize<Return>>
  : T extends z.ZodLazy<infer T>
  ? Serialize<T>
  : T extends z.ZodEffects<infer T>
  ? Serialize<T>
  : T extends z.ZodEnum<infer Values>
  ? SzEnum<Values>
  : T extends z.ZodNativeEnum<infer _Values>
  ? { type: "unknown" }
  : T extends z.ZodCatch<infer Value>
  ? SzCatch<Value["_type"]>
  : T extends z.ZodPromise<infer Value>
  ? SzPromise<Serialize<Value>>
  : T extends z.ZodBranded<infer T, infer _Brand>
  ? Serialize<T>
  : T extends z.ZodPipeline<infer In, infer Out>
  ? Serialize<Out>
  : unknown;

// Must match the exported Serialize types
export function serialize<T extends Schema>(_schema: T): Serialize<T>;
export function serialize(schema: Schema): unknown {
  if (schema instanceof z.ZodOptional) {
    return { ...serialize(schema._def.innerType), isOptional: true };
  }
  if (schema instanceof z.ZodNullable) {
    return { ...serialize(schema._def.innerType), isNullable: true };
  }
  if (schema instanceof z.ZodDefault) {
    return {
      ...serialize(schema._def.innerType),
      defaultValue: schema._def.defaultValue(),
    };
  }

  if (schema instanceof z.ZodNumber) {
    const checks = schema._def.checks.reduce(
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
    return { type: "number", ...checks };
  }

  if (
    schema instanceof z.ZodString ||
    schema instanceof z.ZodNaN ||
    schema instanceof z.ZodBigInt ||
    schema instanceof z.ZodBoolean ||
    schema instanceof z.ZodDate ||
    schema instanceof z.ZodUndefined ||
    schema instanceof z.ZodNull ||
    schema instanceof z.ZodAny ||
    schema instanceof z.ZodUnknown ||
    schema instanceof z.ZodNever ||
    schema instanceof z.ZodVoid
  ) {
    return {
      type: PRIMITIVES[schema._def.typeName],
    };
  }

  if (schema instanceof z.ZodLiteral) {
    return { type: "literal", value: schema.value };
  }

  if (schema instanceof z.ZodArray) {
    return { type: "array", element: serialize(schema._def.type) };
  }

  if (schema instanceof z.ZodObject) {
    return {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(schema._def.shape()).map(([key, value]) => [
          key,
          serialize(value as Schema),
        ])
      ),
    };
  }

  if (schema instanceof z.ZodUnion) {
    return { type: "union", options: schema.options.map(serialize) };
  }

  if (schema instanceof z.ZodDiscriminatedUnion) {
    const { discriminator } = schema;
    return {
      type: "discriminatedUnion",
      discriminator,
      options: schema.options.map(serialize),
    };
  }

  if (schema instanceof z.ZodIntersection) {
    return {
      type: "intersection",
      left: serialize(schema._def.left),
      right: serialize(schema._def.right),
    };
  }

  if (schema instanceof z.ZodTuple) {
    return { type: "tuple", items: schema._def.items.map(serialize) };
  }

  if (schema instanceof z.ZodRecord) {
    return {
      type: "record",
      value: serialize(schema._def.valueType),
    };
  }

  if (schema instanceof z.ZodMap) {
    return {
      type: "map",
      key: serialize(schema._def.keyType),
      value: serialize(schema._def.valueType),
    };
  }

  if (schema instanceof z.ZodSet) {
    return { type: "set", value: serialize(schema._def.valueType) };
  }

  if (schema instanceof z.ZodFunction) {
    return {
      type: "function",
      args: serialize(schema._def.args),
      returns: serialize(schema._def.returns),
    };
  }

  if (schema instanceof z.ZodLazy) {
    return serialize(schema._def.getter());
  }

  if (schema instanceof z.ZodEffects) {
    return serialize(schema._def.schema);
  }

  if (schema instanceof z.ZodEnum) {
    return { type: "enum", values: schema._def.values };
  }

  if (schema instanceof z.ZodNativeEnum) {
    return { type: "unknown" };
  }

  if (schema instanceof z.ZodCatch) {
    return { type: "catch" /* value: schema._def.catchValue() */ };
  }

  if (schema instanceof z.ZodPromise) {
    return { type: "promise", value: serialize(schema._def.type) };
  }

  if (schema instanceof z.ZodBranded) {
    return serialize(schema._def.type);
  }

  if (schema instanceof z.ZodPipeline) {
    return serialize(schema._def.out);
  }

  schema satisfies never;
}
