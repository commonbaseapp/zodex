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
  SzLazy,
  SzRef,
} from "./types";
import { ZodRef, ZodTypes } from "./zod-types";

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
type OmitKey<T, K> = DistributiveOmit<T, keyof K>;

interface DezerializeContext {
  seenSchemas: Map<string, ZodTypes>;
  pendingSchemas: Map<string, ZodTypes>;
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
    : T extends SzLazy
    ? z.ZodLazy<() => Dezerialize<T["schema"]>>
    : T extends SzRef
    ? ZodRef
    : unknown;

type DezerializersMap = {
  [T in SzType["type"]]: (
    shape: Extract<SzType, { type: T }>,
    ctx: DezerializeContext
  ) => ZodTypes; //Dezerialize<Extract<SzType, { type: T }>>;
};

const dezerializers = {
  number: (shape, ctx) => {
    let n = shape.coerce ? z.coerce.number() : z.number();
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
  string: (shape, ctx) => {
    let s = shape.coerce ? z.coerce.string() : z.string();
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
  boolean: (shape, ctx) => (shape.coerce ? z.coerce.boolean() : z.boolean()),
  nan: (shape, ctx) => z.nan(),
  bigInt: (shape, ctx) => {
    let i = shape.coerce ? z.coerce.bigint() : z.bigint();
    if (shape.min !== undefined) {
      const min = BigInt(shape.min);
      i = shape.minInclusive ? i.min(min) : i.gt(min);
    }
    if (shape.max !== undefined) {
      const max = BigInt(shape.max);
      i = shape.maxInclusive ? i.max(max) : i.lt(max);
    }
    if (shape.multipleOf !== undefined) {
      const multipleOf = BigInt(shape.multipleOf);
      i = i.multipleOf(multipleOf);
    }
    return i;
  },
  date: (shape, ctx) => {
    let i = shape.coerce ? z.coerce.date() : z.date();
    if (shape.min !== undefined) {
      i = i.min(new Date(shape.min));
    }
    if (shape.max !== undefined) {
      i = i.max(new Date(shape.max));
    }
    return i;
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
    );
    if (shape.rest) {
      i = i.rest(dezerializeWithContext(shape.rest, ctx) as any);
    }
    return i;
  },
  set: (shape: SzSet, ctx) => {
    let i = z.set(dezerializeWithContext(shape.value, ctx));
    if (shape.minSize !== undefined) {
      i = i.min(shape.minSize);
    }
    if (shape.maxSize !== undefined) {
      i = i.max(shape.maxSize);
    }
    return i;
  },
  array: (shape: SzArray, ctx) => {
    let i = z.array(dezerializeWithContext(shape.element, ctx));
    if (shape.minLength !== undefined) {
      i = i.min(shape.minLength);
    }
    if (shape.maxLength !== undefined) {
      i = i.max(shape.maxLength);
    }
    return i;
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
    if (ctx.seenSchemas.has(shape.schema)) {
      return z.lazy(() => ctx.seenSchemas.get(shape.schema) as ZodTypes);
    }
    const lazySchema = z.lazy(() => dezerializeWithContext(shape.schema, ctx));
    ctx.seenSchemas.set(shape.schema, lazySchema);
    return lazySchema;
  },
  ref: (shape, ctx) => {
    if (!ctx.seenSchemas.has(shape.ref)) {
      throw new Error(`Reference not found for ref: ${shape.ref}`);
    }
    return ctx.seenSchemas.get(shape.ref) as ZodTypes;
  },
} satisfies DezerializersMap as DezerializersMap;

function preRegisterSchemas(shape, ctx) {
  if (shape.id) {
    if (!ctx.seenSchemas.has(shape.id)) {
      ctx.seenSchemas.set(shape.id, null); // Placeholder
    }
  }

  if (shape.type === "object" && shape.properties) {
    for (const key in shape.properties) {
      preRegisterSchemas(shape.properties[key], ctx);
    }
  } else if (shape.type === "array" && shape.element) {
    preRegisterSchemas(shape.element, ctx);
  } else if (shape.type === "ref") {
    if (!ctx.seenSchemas.has(shape.ref)) {
      ctx.seenSchemas.set(shape.ref, null); // Placeholder
    }
  }
}

function dezerializeWithContext(shape, ctx) {
  // Check if shape is valid
  if (!shape) {
    console.error("Invalid shape provided to dezerializeWithContext:", shape);
    throw new Error("Invalid shape provided to dezerializeWithContext");
  }

  const shapeId = shape.id ?? shape.ref;

  if (ctx.seenSchemas.has(shapeId)) {
    const existingSchema = ctx.seenSchemas.get(shapeId);
    if (existingSchema) {
      return existingSchema;
    }
  }

  if (ctx.pendingSchemas.has(shapeId)) {
    return z.lazy(() => ctx.pendingSchemas.get(shapeId) as ZodTypes);
  }

  ctx.pendingSchemas.set(shapeId, shape);

  let result;
  if (shape.type === "lazy") {
    if (shape.schema) {
      result = z.lazy(() => resolveReferences(shape.schema, ctx));
    } else if (shape.ref) {
      result = z.lazy(() =>
        resolveReferences({ type: "ref", ref: shape.ref }, ctx)
      );
    } else {
      throw new Error("Lazy type must have either schema or ref");
    }
  } else if (shape.type === "ref") {
    if (ctx.seenSchemas.has(shape.ref)) {
      result = ctx.seenSchemas.get(shape.ref);
    } else {
      if (!ctx.pendingSchemas.has(shape.ref)) {
        ctx.pendingSchemas.set(shape.ref, null); // Placeholder
      }
      result = z.lazy(() =>
        resolveReferences({ type: "ref", ref: shape.ref }, ctx)
      );
    }
  } else if (shape.type in dezerializers) {
    result = dezerializers[shape.type](shape, ctx);
  } else {
    throw new Error(`Unknown shape type: ${shape.type}`);
  }

  if ("isOptional" in shape) {
    const { isOptional, ...rest } = shape;
    result = isOptional ? result.optional() : result;
  }
  if ("isNullable" in shape) {
    const { isNullable, ...rest } = shape;
    result = isNullable ? result.nullable() : result;
  }
  if ("defaultValue" in shape) {
    const { defaultValue, ...rest } = shape;
    result = result.default(defaultValue);
  }

  ctx.pendingSchemas.set(shapeId, result);

  if (shape.id) {
    ctx.seenSchemas.set(shape.id, result);
  } else {
    ctx.seenSchemas.set(shapeId, result);
  }

  return result;
}

function resolveReferences(shape, ctx) {
  if (typeof shape === "object" && "ref" in shape) {
    if (ctx.seenSchemas.has(shape.ref?.id ?? shape.ref.ref ?? shape.ref)) {
      const existingSchema = ctx.seenSchemas.get(
        shape.ref?.id ?? shape.ref.ref ?? shape.ref
      );
      if (existingSchema) {
        return existingSchema;
      } else {
        return z.lazy(() =>
          ctx.seenSchemas.get(shape.ref?.id ?? shape.ref.ref ?? shape.ref)
        );
      }
    } else {
      if (
        !ctx.pendingSchemas.has(shape.ref?.id ?? shape.ref.ref ?? shape.ref)
      ) {
        ctx.pendingSchemas.set(
          shape.ref?.id ?? shape.ref.ref ?? shape.ref,
          null
        ); // Placeholder
      }
      return z.lazy(() =>
        resolveReferences(
          { type: "ref", ref: shape.ref?.id ?? shape.ref.ref ?? shape.ref },
          ctx
        )
      );
    }
  }
  return dezerializeWithContext(shape, ctx);
}

function preRegister(shape, ctx) {
  preRegisterSchemas(shape, ctx);
}

export function dezerialize(shape) {
  const ctx: DezerializeContext = {
    seenSchemas: new Map(),
    pendingSchemas: new Map(),
  };

  preRegister(shape, ctx);

  return dezerializeWithContext(shape, ctx);
}
