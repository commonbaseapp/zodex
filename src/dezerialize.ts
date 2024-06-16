import { z } from 'zod'
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
  SzLazy,
} from './types'
import { ZodTypes } from './zod-types'

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never
type OmitKey<T, K> = DistributiveOmit<T, keyof K>

interface DezerializeContext {
  seenSchemas: Map<SzType, ZodTypes>
  pendingSchemas: Map<SzType, ZodTypes>
}

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
        [Property in keyof Properties]: Dezerialize<Properties[Property]>
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
    : T extends SzLazy
    ? z.ZodLazy<() => Dezerialize<T['schema']>>
    : unknown

type DezerializersMap = {
  [T in SzType['type']]: (
    shape: Extract<SzType, { type: T }>,
    ctx: DezerializeContext
  ) => ZodTypes //Dezerialize<Extract<SzType, { type: T }>>;
}
const dezerializers = {
  number: (shape, ctx) => {
    let n = shape.coerce ? z.coerce.number() : z.number()
    if (shape.min !== undefined) {
      n = shape.minInclusive ? n.min(shape.min) : n.gt(shape.min)
    }
    if (shape.max !== undefined) {
      n = shape.maxInclusive ? n.max(shape.max) : n.lt(shape.max)
    }
    if (shape.multipleOf !== undefined) {
      n = n.multipleOf(shape.multipleOf)
    }
    if (shape.int) {
      n = n.int()
    }
    if (shape.finite) {
      n = n.finite()
    }
    return n
  },
  string: (shape, ctx) => {
    let s = shape.coerce ? z.coerce.string() : z.string()
    if (shape.min !== undefined) {
      s = s.min(shape.min)
    }
    if (shape.max !== undefined) {
      s = s.max(shape.max)
    }
    if (shape.length !== undefined) {
      s = s.length(shape.length)
    }
    if (shape.startsWith !== undefined) {
      s = s.startsWith(shape.startsWith)
    }
    if (shape.endsWith !== undefined) {
      s = s.endsWith(shape.endsWith)
    }
    if ('includes' in shape) {
      s = s.includes(shape.includes, { position: shape.position })
    }
    if ('regex' in shape) {
      s = s.regex(new RegExp(shape.regex, shape.flags))
    }
    if ('kind' in shape) {
      if (shape.kind == 'ip') {
        s = s.ip({ version: shape.version })
      } else if (shape.kind == 'datetime') {
        s = s.datetime({ offset: shape.offset, precision: shape.precision })
      } else {
        s = s[shape.kind]()
      }
    }

    return s
  },
  boolean: (shape, ctx) => (shape.coerce ? z.coerce.boolean() : z.boolean()),
  nan: (shape, ctx) => z.nan(),
  bigInt: (shape, ctx) => {
    let i = shape.coerce ? z.coerce.bigint() : z.bigint()
    if (shape.min !== undefined) {
      const min = BigInt(shape.min)
      i = shape.minInclusive ? i.min(min) : i.gt(min)
    }
    if (shape.max !== undefined) {
      const max = BigInt(shape.max)
      i = shape.maxInclusive ? i.max(max) : i.lt(max)
    }
    if (shape.multipleOf !== undefined) {
      const multipleOf = BigInt(shape.multipleOf)
      i = i.multipleOf(multipleOf)
    }
    return i
  },
  date: (shape, ctx) => {
    let i = shape.coerce ? z.coerce.date() : z.date()
    if (shape.min !== undefined) {
      i = i.min(new Date(shape.min))
    }
    if (shape.max !== undefined) {
      i = i.max(new Date(shape.max))
    }
    return i
  },
  undefined: (shape, ctx) => z.undefined(),
  null: (shape, ctx) => z.null(),
  any: (shape, ctx) => z.any(),
  unknown: (shape, ctx) => z.unknown(),
  never: (shape, ctx) => z.never(),
  void: (shape, ctx) => z.void(),

  literal: (shape, ctx) => z.literal(shape.value),

  tuple: (shape: SzTuple, ctx) => {
    let i = z.tuple(
      shape.items.map((item) => dezerializeWithContext(item, ctx)) as any
    )
    if (shape.rest) {
      i = i.rest(dezerializeWithContext(shape.rest, ctx) as any)
    }
    return i
  },
  set: (shape: SzSet, ctx) => {
    let i = z.set(dezerializeWithContext(shape.value, ctx))
    if (shape.minSize !== undefined) {
      i = i.min(shape.minSize)
    }
    if (shape.maxSize !== undefined) {
      i = i.max(shape.maxSize)
    }
    return i
  },
  array: (shape: SzArray, ctx) => {
    let i = z.array(dezerializeWithContext(shape.element, ctx))
    if (shape.minLength !== undefined) {
      i = i.min(shape.minLength)
    }
    if (shape.maxLength !== undefined) {
      i = i.max(shape.maxLength)
    }
    return i
  },
  object: (shape: SzObject, ctx) =>
    z.object(
      Object.fromEntries(
        Object.entries(shape.properties).map(([key, value]) => [
          key,
          dezerializeWithContext(value, ctx),
        ])
      )
    ),
  record: (shape: SzRecord, ctx) =>
    z.record(
      dezerializeWithContext(shape.key, ctx),
      dezerializeWithContext(shape.value, ctx)
    ),
  map: (shape: SzMap<any, any>, ctx) =>
    z.map(
      dezerializeWithContext(shape.key, ctx),
      dezerializeWithContext(shape.value, ctx)
    ),
  enum: (shape: SzEnum, ctx) => z.enum(shape.values),
  union: (shape: SzUnion, ctx) =>
    z.union(
      shape.options.map((option) => dezerializeWithContext(option, ctx)) as any
    ),
  discriminatedUnion: (shape: SzDiscriminatedUnion, ctx) =>
    z.discriminatedUnion(
      shape.discriminator,
      shape.options.map((option) => dezerializeWithContext(option, ctx)) as any
    ),
  intersection: (shape: SzIntersection, ctx) =>
    z.intersection(
      dezerializeWithContext(shape.left, ctx),
      dezerializeWithContext(shape.right, ctx)
    ),
  function: (shape: SzFunction<any, any>, ctx) =>
    z.function(
      dezerializeWithContext(shape.args, ctx) as any,
      dezerializeWithContext(shape.returns, ctx)
    ),
  promise: (shape: SzPromise, ctx) =>
    z.promise(dezerializeWithContext(shape.value, ctx)),
  lazy: (shape: SzLazy, ctx) => {
    return z.lazy(() => dezerializeWithContext(shape.schema, ctx))
  },
} satisfies DezerializersMap as DezerializersMap

// Must match the exported Dezerialize types
// export function dezerialize<T extends SzType>(_shape: T): Dezerialize<T>;
export function dezerialize(shape: SzType): ZodTypes {
  const ctx: DezerializeContext = {
    seenSchemas: new Map(),
    pendingSchemas: new Map(),
  }
  return dezerializeWithContext(shape, ctx)
}
function dezerializeWithContext(
  shape: SzType,
  ctx: DezerializeContext
): ZodTypes {
  if (ctx.seenSchemas.has(shape)) {
    return ctx.seenSchemas.get(shape) as ZodTypes
  }

  if (ctx.pendingSchemas.has(shape)) {
    return ctx.pendingSchemas.get(shape) as ZodTypes
  }

  let result: ZodTypes
  if ('isOptional' in shape) {
    const { isOptional, ...rest } = shape
    const inner = dezerializeWithContext(rest, ctx)
    result = isOptional ? inner.optional() : inner
  } else if ('isNullable' in shape) {
    const { isNullable, ...rest } = shape
    const inner = dezerializeWithContext(rest, ctx)
    result = isNullable ? inner.nullable() : inner
  } else if ('defaultValue' in shape) {
    const { defaultValue, ...rest } = shape
    const inner = dezerializeWithContext(rest, ctx)
    result = inner.default(defaultValue)
  } else {
    result = dezerializers[shape.type](shape as any, ctx)
  }

  ctx.pendingSchemas.delete(shape)
  ctx.seenSchemas.set(shape, result)

  return result
}
