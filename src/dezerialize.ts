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
  SzType,
  SzString,
  SzNumber,
  SzBoolean,
  SzBigInt,
  SzNaN,
  SzDate,
  SzAny,
  SzNever,
  SzNull,
  SzUndefined,
  SzUnknown,
  SzVoid,
} from "./types";
import { ZodTypes } from "./zod-types";

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
type OmitKey<T, K> = DistributiveOmit<T, keyof K>;

// Types must match the exported dezerialize function's implementation
export type Dezerialize<T extends SzType> =
  // Modifier types
  T extends SzOptional
    ? Dezerialize<OmitKey<T, SzOptional>> extends infer I
      ? I extends ZodTypes
        ? z.ZodOptional<I>
        : never
      : never
    : T extends SzNullable
    ? Dezerialize<OmitKey<T, SzNullable>> extends infer I
      ? I extends ZodTypes
        ? z.ZodNullable<I>
        : never
      : never
    : T extends SzDefault<any>
    ? Dezerialize<OmitKey<T, SzDefault<any>>> extends infer I
      ? I extends ZodTypes
        ? z.ZodDefault<I>
        : never
      : never // Primitives
    : T extends SzString
    ? z.ZodString
    : T extends SzNumber
    ? z.ZodNumber
    : T extends SzBoolean
    ? z.ZodBoolean
    : T extends SzBigInt
    ? z.ZodBigInt
    : T extends SzNaN
    ? z.ZodNaN
    : T extends SzDate
    ? z.ZodDate
    : T extends SzUndefined
    ? z.ZodUndefined
    : T extends SzNull
    ? z.ZodNull
    : T extends SzAny
    ? z.ZodAny
    : T extends SzUnknown
    ? z.ZodUnknown
    : T extends SzNever
    ? z.ZodNever
    : T extends SzVoid
    ? z.ZodVoid
    : T extends SzLiteral<infer Value>
    ? z.ZodLiteral<Value> // List Collections
    : T extends SzTuple<infer _Items>
    ? z.ZodTuple<any> //DezerializeArray<Items>>
    : T extends SzSet<infer Value>
    ? z.ZodSet<Dezerialize<Value>>
    : T extends SzArray<infer Element>
    ? z.ZodArray<Dezerialize<Element>> // Key/Value Collections
    : T extends SzObject<infer Properties>
    ? z.ZodObject<{
        [Property in keyof Properties]: Dezerialize<Properties[Property]>;
      }>
    : T extends SzRecord<infer Key, infer Value>
    ? z.ZodRecord<Dezerialize<Key>, Dezerialize<Value>>
    : T extends SzMap<infer Key, infer Value>
    ? z.ZodMap<Dezerialize<Key>, Dezerialize<Value>> // Enum
    : T extends SzEnum<infer Values>
    ? z.ZodEnum<Values> // Union/Intersection
    : T extends SzUnion<infer _Options>
    ? z.ZodUnion<any>
    : T extends SzDiscriminatedUnion<infer Discriminator, infer _Options>
    ? z.ZodDiscriminatedUnion<Discriminator, any>
    : T extends SzIntersection<infer L, infer R>
    ? z.ZodIntersection<Dezerialize<L>, Dezerialize<R>> // Specials
    : T extends SzFunction<infer Args, infer Return>
    ? z.ZodFunction<Dezerialize<Args>, Dezerialize<Return>>
    : T extends SzPromise<infer Value>
    ? z.ZodPromise<Dezerialize<Value>>
    : unknown;

type DezerializersMap = {
  [T in SzType["type"]]: (shape: Extract<SzType, { type: T }>) => ZodTypes; //Dezerialize<Extract<SzType, { type: T }>>;
};
const dezerializers = {
  number: (shape) => {
    let n = z.number();
    if (shape.min !== undefined) {
      n = shape.minInclusive ? n.min(shape.min) : n.gt(shape.min);
    }
    if (shape.max !== undefined) {
      n = shape.maxInclusive ? n.max(shape.max) : n.lt(shape.max);
    }
    if (shape.multipleOf !== undefined) {
      n = n.multipleOf(shape.multipleOf);
    }
    if (shape.int) {
      n = n.int();
    }
    if (shape.finite) {
      n = n.finite();
    }
    return n;
  },
  string: (shape) => {
    let s = z.string();
    if (shape.min !== undefined) {
      s = s.min(shape.min);
    }
    if (shape.max !== undefined) {
      s = s.max(shape.max);
    }
    if (shape.length !== undefined) {
      s = s.length(shape.length);
    }
    if (shape.startsWith !== undefined) {
      s = s.startsWith(shape.startsWith);
    }
    if (shape.endsWith !== undefined) {
      s = s.endsWith(shape.endsWith);
    }
    if ("includes" in shape) {
      s = s.includes(shape.includes, { position: shape.position });
    }
    if ("regex" in shape) {
      s = s.regex(new RegExp(shape.regex, shape.flags));
    }
    if ("kind" in shape) {
      if (shape.kind == "ip") {
        s = s.ip({ version: shape.version });
      } else if (shape.kind == "datetime") {
        s = s.datetime({ offset: shape.offset, precision: shape.precision });
      } else {
        s = s[shape.kind]();
      }
    }

    return s;
  },
  boolean: () => z.boolean(),
  nan: () => z.nan(),
  bigInt: (shape) => {
    let i = z.bigint();
    if (shape.min !== undefined) {
      i = shape.minInclusive ? i.min(shape.min) : i.gt(shape.min);
    }
    if (shape.max !== undefined) {
      i = shape.maxInclusive ? i.max(shape.max) : i.lt(shape.max);
    }
    if (shape.multipleOf !== undefined) {
      i = i.multipleOf(shape.multipleOf);
    }
    return i;
  },
  date: (shape) => {
    let i = z.date();
    if (shape.min !== undefined) {
      i = i.min(new Date(shape.min));
    }
    if (shape.max !== undefined) {
      i = i.max(new Date(shape.max));
    }
    return i;
  },
  undefined: () => z.undefined(),
  null: () => z.null(),
  any: () => z.any(),
  unknown: () => z.unknown(),
  never: () => z.never(),
  void: () => z.void(),

  literal: (shape) => z.literal(shape.value),

  tuple: ((shape: SzTuple) => {
    let i = z.tuple(shape.items.map(dezerialize) as any);
    if (shape.rest) {
      i = i.rest(dezerialize(shape.rest) as any);
    }
    return i;
  }) as any,
  set: ((shape: SzSet) => {
    let i = z.set(dezerialize(shape.value));
    if (shape.minSize !== undefined) {
      i = i.min(shape.minSize);
    }
    if (shape.maxSize !== undefined) {
      i = i.max(shape.maxSize);
    }
    return i;
  }) as any,
  array: ((shape: SzArray) => {
    let i = z.array(dezerialize(shape.element));
    if (shape.minLength !== undefined) {
      i = i.min(shape.minLength);
    }
    if (shape.maxLength !== undefined) {
      i = i.max(shape.maxLength);
    }
    return i;
  }) as any,

  object: ((shape: SzObject) =>
    z.object(
      Object.fromEntries(
        Object.entries(shape.properties).map(([key, value]) => [
          key,
          dezerialize(value),
        ])
      )
    )) as any,
  record: ((shape: SzRecord) =>
    z.record(dezerialize(shape.key), dezerialize(shape.value))) as any,
  map: ((shape: SzMap<any, any>) =>
    z.map(dezerialize(shape.key), dezerialize(shape.value))) as any,

  enum: ((shape: SzEnum) => z.enum(shape.values)) as any,

  union: ((shape: SzUnion) =>
    z.union(shape.options.map(dezerialize) as any)) as any,
  discriminatedUnion: ((shape: SzDiscriminatedUnion) =>
    z.discriminatedUnion(
      shape.discriminator,
      shape.options.map(dezerialize) as any
    )) as any,
  intersection: ((shape: SzIntersection) =>
    z.intersection(dezerialize(shape.left), dezerialize(shape.right))) as any,

  function: ((shape: SzFunction<any, any>) =>
    z.function(
      dezerialize(shape.args) as any,
      dezerialize(shape.returns)
    )) as any,
  promise: ((shape: SzPromise) => z.promise(dezerialize(shape.value))) as any,
} satisfies DezerializersMap as DezerializersMap;

// Must match the exported Dezerialize types
// export function dezerialize<T extends SzType>(_shape: T): Dezerialize<T>;
export function dezerialize(shape: SzType): ZodTypes {
  if ("isOptional" in shape) {
    const { isOptional, ...rest } = shape;
    const inner = dezerialize(rest);
    return isOptional ? inner.optional() : inner;
  }

  if ("isNullable" in shape) {
    const { isNullable, ...rest } = shape;
    const inner = dezerialize(rest);
    return isNullable ? inner.nullable() : inner;
  }

  if ("defaultValue" in shape) {
    const { defaultValue, ...rest } = shape;
    const inner = dezerialize(rest);
    return inner.default(defaultValue);
  }

  return dezerializers[shape.type](shape as any);
}
