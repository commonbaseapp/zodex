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
  SzNumber,
  SzPrimitive,
  SzType,
  STRING_KINDS,
} from './types'
import { ZodRef, ZodTypes, ZTypeName } from './zod-types'

export const PRIMITIVES = {
  ZodString: 'string',
  ZodNumber: 'number',
  ZodBoolean: 'boolean',
  ZodNaN: 'nan',
  ZodBigInt: 'bigInt',
  ZodDate: 'date',
  ZodUndefined: 'undefined',
  ZodNull: 'null',
  ZodAny: 'any',
  ZodUnknown: 'unknown',
  ZodNever: 'never',
  ZodVoid: 'void',
} as const satisfies Readonly<
  Partial<
    Record<Exclude<z.ZodFirstPartyTypeKind, 'ZodSymbol'>, SzPrimitive['type']>
  >
>
export type PrimitiveMap = typeof PRIMITIVES

type IsZodPrimitive<T extends ZodTypes> =
  ZTypeName<T> extends keyof PrimitiveMap ? any : never

// Types must match the exported zerialize function's implementation
export type Zerialize<T extends ZodTypes> =
  // Modifier types
  T extends z.ZodOptional<infer I>
    ? Zerialize<I> & SzOptional
    : T extends z.ZodNullable<infer I>
    ? Zerialize<I> & SzNullable
    : T extends z.ZodDefault<infer I>
    ? Zerialize<I> & SzDefault<I['_type']>
    : // Primitives
    T extends z.ZodNumber
    ? SzNumber
    : T extends IsZodPrimitive<T>
    ? { type: PrimitiveMap[ZTypeName<T>] }
    : //
    T extends z.ZodLiteral<infer T>
    ? SzLiteral<T>
    : // List Collections
    T extends z.ZodTuple<infer Items>
    ? {
        [Index in keyof Items]: Zerialize<Items[Index]>
      } extends infer SzItems extends [SzType, ...SzType[]] | []
      ? SzTuple<SzItems>
      : SzType
    : T extends z.ZodSet<infer T>
    ? SzSet<Zerialize<T>>
    : T extends z.ZodArray<infer T>
    ? SzArray<Zerialize<T>>
    : // Key/Value Collections
    T extends z.ZodObject<infer Properties>
    ? SzObject<{
        [Property in keyof Properties]: Zerialize<Properties[Property]>
      }>
    : T extends z.ZodRecord<infer Key, infer Value>
    ? SzRecord<Zerialize<Key>, Zerialize<Value>>
    : T extends z.ZodMap<infer Key, infer Value>
    ? SzMap<Zerialize<Key>, Zerialize<Value>>
    : // Enums
    T extends z.ZodEnum<infer Values>
    ? SzEnum<Values>
    : T extends z.ZodNativeEnum<infer _Values>
    ? { type: 'unknown' }
    : // Union/Intersection
    T extends z.ZodUnion<infer Options>
    ? {
        [Index in keyof Options]: Zerialize<Options[Index]>
      } extends infer SzOptions extends [SzType, ...SzType[]]
      ? SzUnion<SzOptions>
      : SzType
    : T extends z.ZodDiscriminatedUnion<infer Discriminator, infer Options>
    ? SzDiscriminatedUnion<
        Discriminator,
        {
          [Index in keyof Options]: Zerialize<Options[Index]>
        }
      >
    : T extends z.ZodIntersection<infer L, infer R>
    ? SzIntersection<Zerialize<L>, Zerialize<R>>
    : // Specials
    T extends z.ZodFunction<infer Args, infer Return>
    ? Zerialize<Args> extends infer SzArgs extends SzTuple
      ? SzFunction<SzArgs, Zerialize<Return>>
      : SzType
    : T extends z.ZodPromise<infer Value>
    ? SzPromise<Zerialize<Value>>
    : // Unserializable types, fallback to serializing inner type
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
    : SzType

type ZodTypeMap = {
  [Key in ZTypeName<ZodTypes>]: Extract<ZodTypes, { _def: { typeName: Key } }>
}
type ZerializersMap = {
  [Key in ZTypeName<ZodTypes>]: (
    def: ZodTypeMap[Key]['_def'],
    ctx: ZerializeContext
  ) => any //Zerialize<ZodTypeMap[Key]>;
}

interface ZerializeContext {
  seenSchemas: Map<ZodTypes, any>
  pendingSchemas: Map<ZodTypes, any>
  nextId: number
}

const s = (schema: ZodTypes, ctx: ZerializeContext) =>
  zerializeWithContext(schema, ctx)
const zerializers = {
  ZodOptional: (def, ctx) => ({ ...s(def.innerType, ctx), isOptional: true }),
  ZodNullable: (def, ctx) => ({ ...s(def.innerType, ctx), isNullable: true }),
  ZodDefault: (def, ctx) => ({
    ...s(def.innerType, ctx),
    defaultValue: def.defaultValue(),
  }),

  ZodNumber: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == 'min'
          ? {
              min: check.value,
              ...(check.inclusive ? { minInclusive: true } : {}),
            }
          : check.kind == 'max'
          ? {
              max: check.value,
              ...(check.inclusive ? { maxInclusive: true } : {}),
            }
          : check.kind == 'multipleOf'
          ? { multipleOf: check.value }
          : check.kind == 'int'
          ? { int: true }
          : check.kind == 'finite'
          ? {
              finite: true,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    )
    return Object.assign(
      { type: 'number', ...checks },
      def.coerce ? { coerce: true } : {}
    )
  },
  ZodString: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == 'min'
          ? { min: check.value }
          : check.kind == 'max'
          ? { max: check.value }
          : check.kind == 'length'
          ? { length: check.value }
          : check.kind == 'startsWith'
          ? { startsWith: check.value }
          : check.kind == 'endsWith'
          ? { endsWith: check.value }
          : check.kind == 'includes'
          ? { includes: check.value, position: check.position }
          : check.kind == 'regex'
          ? {
              regex: check.regex.source,
              ...(check.regex.flags ? { flags: check.regex.flags } : {}),
            }
          : check.kind == 'ip'
          ? { kind: 'ip', version: check.version }
          : check.kind == 'datetime'
          ? {
              kind: 'datetime',
              ...(check.offset ? { offset: check.offset } : {}),
              ...(typeof check.precision === 'number'
                ? { precision: check.precision }
                : {}),
            }
          : STRING_KINDS.has(check.kind as any)
          ? {
              kind: check.kind,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    )
    return Object.assign(
      { type: 'string', ...checks },
      def.coerce ? { coerce: true } : {}
    )
  },
  ZodBoolean: (def) =>
    Object.assign({ type: 'boolean' }, def.coerce ? { coerce: true } : {}),
  ZodNaN: () => ({ type: 'nan' }),
  ZodBigInt: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == 'min'
          ? {
              min: String(check.value),
              ...(check.inclusive ? { minInclusive: true } : {}),
            }
          : check.kind == 'max'
          ? {
              max: String(check.value),
              ...(check.inclusive ? { maxInclusive: true } : {}),
            }
          : check.kind == 'multipleOf'
          ? {
              multipleOf: String(check.value),
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    )
    return Object.assign(
      { type: 'bigInt', ...checks },
      def.coerce ? { coerce: true } : {}
    )
  },
  ZodDate: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == 'min'
          ? { min: check.value }
          : check.kind == 'max'
          ? {
              max: check.value,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    )
    return Object.assign(
      { type: 'date', ...checks },
      def.coerce ? { coerce: true } : {}
    )
  },
  ZodUndefined: () => ({ type: 'undefined' }),
  ZodNull: () => ({ type: 'null' }),
  ZodAny: () => ({ type: 'any' }),
  ZodUnknown: () => ({ type: 'unknown' }),
  ZodNever: () => ({ type: 'never' }),
  ZodVoid: () => ({ type: 'void' }),

  ZodLiteral: (def) => ({ type: 'literal', value: def.value }),

  ZodTuple: (def, ctx) => ({
    type: 'tuple',
    items: def.items.map((item) => s(item, ctx)),
    ...(def.rest
      ? {
          rest: s(def.rest, ctx),
        }
      : {}),
  }),
  ZodSet: (def, ctx) => ({
    type: 'set',
    value: s(def.valueType, ctx),
    ...(def.minSize === null ? {} : { minSize: def.minSize.value }),
    ...(def.maxSize === null ? {} : { maxSize: def.maxSize.value }),
  }),
  ZodArray: (def, ctx) => ({
    type: 'array',
    element: s(def.type, ctx),

    ...(def.exactLength === null
      ? {}
      : {
          minLength: def.exactLength.value,
          maxLength: def.exactLength.value,
        }),
    ...(def.minLength === null ? {} : { minLength: def.minLength.value }),
    ...(def.maxLength === null ? {} : { maxLength: def.maxLength.value }),
  }),

  ZodObject: (def, ctx) => ({
    type: 'object',
    properties: Object.fromEntries(
      Object.entries(def.shape()).map(([key, value]) => [
        key,
        s(value as ZodTypes, ctx),
      ])
    ),
  }),
  ZodRecord: (def, ctx) => ({
    type: 'record',
    key: s(def.keyType, ctx),
    value: s(def.valueType, ctx),
  }),
  ZodMap: (def, ctx) => ({
    type: 'map',
    key: s(def.keyType, ctx),
    value: s(def.valueType, ctx),
  }),

  ZodEnum: (def) => ({ type: 'enum', values: def.values }),
  // TODO: turn into enum
  ZodNativeEnum: () => ({ type: 'unknown' }),

  ZodUnion: (def, ctx) => ({
    type: 'union',
    options: def.options.map((option) => s(option, ctx)),
  }),
  ZodDiscriminatedUnion: (def, ctx) => ({
    type: 'discriminatedUnion',
    discriminator: def.discriminator,
    options: def.options.map((option) => s(option, ctx)),
  }),
  ZodIntersection: (def, ctx) => ({
    type: 'intersection',
    left: s(def.left, ctx),
    right: s(def.right, ctx),
  }),

  ZodFunction: (def, ctx) => ({
    type: 'function',
    args: s(def.args, ctx),
    returns: s(def.returns, ctx),
  }),
  ZodPromise: (def, ctx) => ({ type: 'promise', value: s(def.type, ctx) }),

  ZodLazy: (def, ctx) => {
    if (ctx.seenSchemas.has(def.getter())) {
      return { type: 'lazy', ref: ctx.seenSchemas.get(def.getter()) }
    }
    const lazySchema = s(def.getter(), ctx)
    ctx.seenSchemas.set(def.getter(), lazySchema)
    return { type: 'lazy', schema: lazySchema }
  },
  ZodEffects: (def, ctx) => s(def.schema, ctx),
  ZodBranded: (def, ctx) => s(def.type, ctx),
  ZodPipeline: (def, ctx) => s(def.out, ctx),
  ZodCatch: (def, ctx) => s(def.innerType, ctx),
  ZodRef: (def, ctx) => {
    if (ctx.seenSchemas.has(def.schema)) {
      return { type: 'ref', ref: ctx.seenSchemas.get(def.schema) }
    }
    const refSchema = s(def.schema, ctx)
    ctx.seenSchemas.set(def.schema, refSchema)
    return { type: 'ref', ref: refSchema }
  },
} satisfies ZerializersMap as ZerializersMap

// Must match the exported Zerialize types
// export function zerialize<T extends ZodTypes>(_schema: T): Zerialize<T> {
export function zerialize(schema: ZodTypes): unknown {
  const ctx: ZerializeContext = {
    seenSchemas: new Map(),
    pendingSchemas: new Map(),
    nextId: 1,
  }
  return zerializeWithContext(schema, ctx)
}

function zerializeWithContext(
  schema: ZodTypes,
  ctx: ZerializeContext
): unknown {
  const { _def: def } = schema

  if (ctx.seenSchemas.has(schema)) {
    return { type: 'ref', ref: ctx.seenSchemas.get(schema) }
  }

  if (ctx.pendingSchemas.has(schema)) {
    return { type: 'ref', ref: ctx.pendingSchemas.get(schema) }
  }

  const schemaId = ctx.nextId++
  ctx.pendingSchemas.set(schema, schemaId)

  const serialized = zerializers[def.typeName](def as any, ctx)
  ctx.seenSchemas.set(schema, schemaId)
  ctx.pendingSchemas.delete(schema)

  return { ...serialized, id: schemaId }
}
