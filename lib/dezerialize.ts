import { z } from "zod/v4";
import {
  SzOptional,
  SzNullable,
  SzReadonly,
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
  SzEnum,
  SzPromise,
  SzPipe,
  SzTransform,
  SzCatch,
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
  SzSymbol,
  SzUnknown,
  SzVoid,
  SzRef,
  NUMBER_FORMATS,
} from "./types";

import { ZodTypes } from "./zod-types";

type DezerializerOptions = {
  checks?: {
    [key: string]: (opts: { value: unknown }) => Promise<void> | void;
  };
  transforms?: {
    [key: string]: (
      value: unknown,
      ctx: z.core.ParsePayload,
    ) => Promise<unknown> | unknown;
  };
  path: string;
  pathToSchema: Map<string, ZodTypes>;
  $refs: [z.ZodLazy<any>, string][];
  originalShape: SzType;
};

type DistributiveOmit<T, K extends keyof any> = T extends any
  ? Omit<T, K>
  : never;
type OmitKey<T, K> = DistributiveOmit<T, keyof K>;

// Types must match the exported dezerialize function's implementation
export type Dezerialize<T extends SzType | SzRef> = T extends SzRef
  ? any
  : // Modifier types
    T extends SzOptional
    ? Dezerialize<OmitKey<T, SzOptional>> extends infer I
      ? I extends ZodTypes
        ? // @ts-expect-error Not infinite
          z.ZodOptional<I>
        : never
      : never
    : T extends SzNullable
      ? Dezerialize<OmitKey<T, SzNullable>> extends infer I
        ? I extends ZodTypes
          ? z.ZodNullable<I>
          : never
        : never
      : T extends SzReadonly
        ? Dezerialize<OmitKey<T, SzReadonly>> extends infer I
          ? I extends ZodTypes
            ? z.ZodReadonly<I>
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
                          : T extends SzSymbol
                            ? z.ZodSymbol
                            : T extends SzAny
                              ? z.ZodAny
                              : T extends SzUnknown
                                ? z.ZodUnknown
                                : T extends SzNever
                                  ? z.ZodNever
                                  : T extends SzVoid
                                    ? z.ZodVoid
                                    : T extends SzLiteral<
                                          infer Value extends
                                            z.core.util.Primitive
                                        >
                                      ? z.ZodLiteral<Value> // List Collections
                                      : T extends SzPipe
                                        ? z.ZodPipe
                                        : T extends SzTransform
                                          ? z.ZodTransform
                                          : T extends SzTuple<infer _Items>
                                            ? z.ZodTuple<any> //DezerializeArray<Items>>
                                            : T extends SzSet<infer Value>
                                              ? z.ZodSet<Dezerialize<Value>>
                                              : T extends SzArray<infer Element>
                                                ? z.ZodArray<
                                                    Dezerialize<Element>
                                                  > // Key/Value Collections
                                                : T extends SzObject<
                                                      infer Properties
                                                    >
                                                  ? z.ZodObject<{
                                                      [Property in keyof Properties]: Dezerialize<
                                                        Properties[Property]
                                                      >;
                                                    }>
                                                  : T extends SzRecord<
                                                        infer Key,
                                                        infer Value
                                                      >
                                                    ? z.ZodRecord<
                                                        Dezerialize<Key>,
                                                        Dezerialize<Value>
                                                      >
                                                    : T extends SzMap<
                                                          infer Key,
                                                          infer Value
                                                        >
                                                      ? z.ZodMap<
                                                          Dezerialize<Key>,
                                                          Dezerialize<Value>
                                                        > // Enum
                                                      : T extends SzEnum<
                                                            infer Values
                                                          >
                                                        ? z.ZodEnum<Values> // Union/Intersection
                                                        : T extends SzUnion<
                                                              infer _Options
                                                            >
                                                          ? z.ZodUnion<any>
                                                          : T extends SzDiscriminatedUnion<
                                                                infer Discriminator,
                                                                infer _Options
                                                              >
                                                            ? z.ZodDiscriminatedUnion<any>
                                                            : T extends SzIntersection<
                                                                  infer L,
                                                                  infer R
                                                                >
                                                              ? z.ZodIntersection<
                                                                  Dezerialize<L>,
                                                                  Dezerialize<R>
                                                                > // Specials
                                                              : T extends SzPromise<
                                                                    infer Value
                                                                  >
                                                                ? z.ZodPromise<
                                                                    Dezerialize<Value>
                                                                  >
                                                                : T extends SzCatch<
                                                                      infer Value
                                                                    >
                                                                  ? z.ZodCatch<
                                                                      Dezerialize<Value>
                                                                    >
                                                                  : any; // unknown;

type DezerializersMap = {
  [T in SzType["type"]]: (
    shape: Extract<SzType, { type: T }>,
    opts: DezerializerOptions,
  ) => ZodTypes; //Dezerialize<Extract<SzType, { type: T }>>;
};

function checkRef(item: SzType, opts: DezerializerOptions) {
  if ("$ref" in item) {
    const lazy = z.lazy(() => z.string()); // Just a placeholder
    opts.$refs.push([lazy, item.$ref as string]);
    return lazy;
  }
  return false;
}

const getCustomChecks = (
  base: ZodTypes,
  shape: SzType,
  opts: DezerializerOptions,
) => {
  if ("checks" in shape && opts.checks) {
    for (const check of shape.checks as { name: string }[]) {
      base = base.check(opts.checks[check.name]);
    }
  }
  return base;
};

const d = dezerializeRefs;

const dezerializers = {
  number: (shape, opts) => {
    const method =
      shape.format && NUMBER_FORMATS.has(shape.format)
        ? shape.format === "safeint"
          ? "int"
          : shape.format
        : "number";
    let n = shape.coerce ? z.coerce.number() : z[method]();
    if (shape.min !== undefined) {
      n = shape.minInclusive ? n.min(shape.min) : n.gt(shape.min);
    }
    if (shape.max !== undefined) {
      n = shape.maxInclusive ? n.max(shape.max) : n.lt(shape.max);
    }
    if (shape.multipleOf !== undefined) {
      n = n.multipleOf(shape.multipleOf);
    }
    return getCustomChecks(n, shape, opts);
  },
  string: (shape, opts) => {
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
    if (shape.toLowerCase !== undefined) {
      s = s.toLowerCase();
    }
    if (shape.toUpperCase !== undefined) {
      s = s.toUpperCase();
    }
    if (shape.trim !== undefined) {
      s = s.trim();
    }
    if ("includes" in shape) {
      s = s.includes(shape.includes, { position: shape.position });
    }
    if ("regex" in shape) {
      s = s.regex(new RegExp(shape.regex, shape.flags));
    }
    if ("kind" in shape) {
      if (shape.kind == "ip") {
        if (shape.version == "v6") {
          s = z.ipv6();
        } else {
          s = z.ipv4();
        }
      } else if (shape.kind == "cidr") {
        if (shape.version === "v6") {
          s = z.cidrv6();
        } else {
          s = z.cidrv4();
        }
      } else if (shape.kind == "datetime") {
        s = z.iso.datetime({
          offset: shape.offset,
          precision: shape.precision,
          local: shape.local,
        });
      } else if (shape.kind == "time") {
        s = z.iso.time({
          precision: shape.precision,
        });
      } else if (shape.kind === "duration" || shape.kind === "date") {
        s = z.iso[shape.kind]();
      } else if (shape.kind === "jwt") {
        s = "algorithm" in shape ? z.jwt({ alg: shape.algorithm }) : z.jwt();
      } else if (shape.kind !== "json_string") {
        // Todo: how to get `json_string`?
        s = z[shape.kind]();
      }
    }

    return getCustomChecks(s, shape, opts);
  },
  boolean: (shape) =>
    shape.coerce
      ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Sometimes
        // @ts-ignore Not infinite
        z.coerce.boolean()
      : z.boolean(),
  nan: () => z.nan(),
  bigInt: (shape, opts) => {
    const method =
      shape.format && ["uint64", "int64"].includes(shape.format)
        ? shape.format
        : "bigint";
    let i = shape.coerce ? z.coerce.bigint() : z[method]();
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
    return getCustomChecks(i, shape, opts);
  },
  date: (shape, opts) => {
    let i = shape.coerce ? z.coerce.date() : z.date();
    if (shape.min !== undefined) {
      i = i.min(new Date(shape.min));
    }
    if (shape.max !== undefined) {
      i = i.max(new Date(shape.max));
    }
    return getCustomChecks(i, shape, opts);
  },
  undefined: () => z.undefined(),
  null: () => z.null(),
  any: () => z.any(),
  unknown: () => z.unknown(),
  never: () => z.never(),
  void: () => z.void(),

  literal: (shape) => z.literal(shape.values),

  symbol: () => z.symbol(),

  tuple: ((shape: SzTuple, opts: DezerializerOptions) => {
    let i = z.tuple(
      shape.items.map((item, idx) => {
        return (
          checkRef(item, opts) ||
          d(item, {
            ...opts,
            path: opts.path + "/items/" + idx,
          })
        );
      }) as any,
    );

    if (shape.rest) {
      const rest =
        checkRef(shape.rest, opts) ||
        (d(shape.rest, {
          ...opts,
          path: opts.path + "/rest",
        }) as any);
      i = i.rest(rest);
    }
    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,
  set: ((shape: SzSet, opts: DezerializerOptions) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Sometimes
    // @ts-ignore Not infinite
    let i = z.set(
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    if (shape.minSize !== undefined) {
      i = i.min(shape.minSize);
    }
    if (shape.maxSize !== undefined) {
      i = i.max(shape.maxSize);
    }
    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,
  array: ((shape: SzArray, opts: DezerializerOptions) => {
    let i = z.array(
      checkRef(shape.element, opts) ||
        d(shape.element, {
          ...opts,
          path: opts.path + "/element",
        }),
    );
    if (shape.minLength !== undefined) {
      i = i.min(shape.minLength);
    }
    if (shape.maxLength !== undefined) {
      i = i.max(shape.maxLength);
    }
    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,

  object: ((shape: SzObject, opts: DezerializerOptions) => {
    let i = z.object(
      Object.fromEntries(
        Object.entries(shape.properties).map(([key, value]) => {
          return [
            key,
            checkRef(value, opts) ||
              d(value as SzType, {
                ...opts,
                path: opts.path + "/properties/" + key,
              }),
          ];
        }),
      ),
    ) as z.ZodObject<{
      [k: string]: ZodTypes;
    }>;

    if (shape.catchall) {
      i = i.catchall(d(shape.catchall, opts));
    }

    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,
  record: ((shape: SzRecord, opts: DezerializerOptions) => {
    const i = z.record(
      checkRef(shape.key, opts) ||
        (d(shape.key, {
          ...opts,
          path: opts.path + "/key",
        }) as z.ZodString | z.ZodNumber | z.ZodSymbol),
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,
  map: ((shape: SzMap<any, any>, opts: DezerializerOptions) => {
    const i = z.map(
      checkRef(shape.key, opts) ||
        d(shape.key, {
          ...opts,
          path: opts.path + "/key",
        }),
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );

    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,

  enum: ((shape: SzEnum) => z.enum(shape.values)) as any,

  union: ((shape: SzUnion, opts: DezerializerOptions) => {
    const i = z.union(
      shape.options.map(
        (opt, idx) =>
          checkRef(opt, opts) ||
          d(opt, {
            ...opts,
            path: opts.path + "/options/" + idx,
          }),
      ) as any,
    );
    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,
  discriminatedUnion: ((
    shape: SzDiscriminatedUnion,
    opts: DezerializerOptions,
  ) => {
    const i = z.discriminatedUnion(
      shape.discriminator,
      shape.options.map(
        (opt, idx) =>
          checkRef(opt, opts) ||
          d(opt, {
            ...opts,
            path: opts.path + "/options/" + idx,
          }),
      ) as any,
    );
    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,
  intersection: ((shape: SzIntersection, opts: DezerializerOptions) => {
    const i = z.intersection(
      checkRef(shape.left, opts) ||
        d(shape.left, {
          ...opts,
          path: opts.path + "/left",
        }),
      checkRef(shape.right, opts) ||
        d(shape.right, {
          ...opts,
          path: opts.path + "/right",
        }),
    );

    opts.pathToSchema.set(opts.path, i);
    return getCustomChecks(i, shape, opts);
  }) as any,

  promise: ((shape: SzPromise, opts: DezerializerOptions) => {
    const i = z.promise(
      checkRef(shape.value, opts) ||
        d(shape.value, {
          ...opts,
          path: opts.path + "/value",
        }),
    );
    opts.pathToSchema.set(opts.path, i);
    return i;
  }) as any,
  catch: ((shape: SzCatch, opts: DezerializerOptions) => {
    let base =
      checkRef(shape.innerType, opts) ||
      (d(shape.innerType, {
        ...opts,
        path: opts.path + "/innerType",
      }) as any);

    base = base.catch(shape.value);
    opts.pathToSchema.set(opts.path, base);
    return base;
  }) as any,
  transform: (shape: SzTransform, opts: DezerializerOptions) => {
    if (!opts.transforms || !(shape.name in opts.transforms)) {
      throw new Error(
        "Must supply transforms for the given transform name, " + shape.name,
      );
    }
    return z.transform(opts.transforms[shape.name]);
  },
  pipe: (shape: SzPipe, opts: DezerializerOptions) => {
    const base = (checkRef(shape.inner, opts) ||
      d(shape.inner, {
        ...opts,
        path: opts.path + "/inner",
      })) as z.ZodType;

    return getCustomChecks(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Sometimes
      // @ts-ignore Not infinite
      base.pipe(
        d(shape.outer, {
          ...opts,
          path: opts.path + "/outer",
        }),
      ) as z.ZodPipe<ZodTypes, ZodTypes>,
      shape,
      opts,
    );
  },
} satisfies DezerializersMap as DezerializersMap;

// Must match the exported Dezerialize types
// export function dezerialize<T extends SzType>(shape: T, opts?: DezerializerOptions): Dezerialize<T> {
export function dezerializeRefs(
  shape: SzType,
  opts: DezerializerOptions,
): ZodTypes {
  if ("isOptional" in shape) {
    const { isOptional, ...rest } = shape;
    const inner = d(rest, opts);
    const result = isOptional ? inner.optional() : inner;
    opts.pathToSchema.set(opts.path, result);
    return result;
  }

  if ("isNullable" in shape) {
    const { isNullable, ...rest } = shape;
    const inner = d(rest, opts);
    const result = isNullable ? inner.nullable() : inner;
    opts.pathToSchema.set(opts.path, result);
    return result;
  }

  if ("defaultValue" in shape) {
    const { defaultValue, ...rest } = shape;
    const inner = d(rest, opts);
    const result = inner.default(
      shape.type === "bigInt"
        ? BigInt(defaultValue)
        : shape.type === "date"
          ? new Date(defaultValue)
          : defaultValue,
    );
    opts.pathToSchema.set(opts.path, result);
    return result;
  }

  if ("readonly" in shape) {
    const { readonly, ...rest } = shape;
    const inner = d(rest, opts);
    const result = readonly ? inner.readonly() : inner;
    opts.pathToSchema.set(opts.path, result);
    return result;
  }

  if ("description" in shape && typeof shape.description === "string") {
    const { description, ...rest } = shape;
    const inner = d(rest, opts);
    const result = inner.describe(description);
    opts.pathToSchema.set(opts.path, result);
    return result;
  }

  return dezerializers[shape.type](shape as any, opts);
}

function resolvePointer(obj: any, pointer: string): any {
  const tokens = pointer.split("/").slice(1);
  return tokens.reduce((acc, token) => {
    /* c8 ignore next -- Guard */
    if (acc === undefined) return acc;
    return acc[token.replace(/~1/g, "/").replace(/~0/g, "~")];
  }, obj);
}

export function dezerialize(
  shape: SzType,
  opts: Partial<DezerializerOptions> = {},
): ZodTypes {
  if (!("path" in opts)) {
    opts.path = "#";
  }
  if (!("pathToSchema" in opts)) {
    opts.pathToSchema = new Map();
  }
  if (!("$refs" in opts)) {
    opts.$refs = [];
  }
  if (!("originalShape" in opts)) {
    opts.originalShape = shape;
  }

  const options = opts as DezerializerOptions;

  const dez = dezerializeRefs(shape, options);

  for (const [lazy, $ref] of options.$refs) {
    lazy.def.getter = () => {
      const schema = options.pathToSchema.get($ref);
      if (schema) {
        return schema;
      }

      const obj = resolvePointer(options.originalShape, $ref);

      // Ensure we act on the same options as the main document JSON
      const dez = dezerialize(obj, options);
      options.pathToSchema.set($ref, dez);
      return dez;
    };
  }

  return dez;
}
