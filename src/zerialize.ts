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
  SzNumber,
  SzEffect,
  SzReadonly,
  SzPrimitive,
  SzType,
  SzUnknown,
  STRING_KINDS,
  SzRef,
} from "./types";
import { ZodTypes, ZTypeName } from "./zod-types";

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
  ZodSymbol: "symbol",
} as const satisfies Readonly<
  Partial<Record<z.ZodFirstPartyTypeKind, SzPrimitive["type"]>>
>;
export type PrimitiveMap = typeof PRIMITIVES;

type IsZodPrimitive<T extends ZodTypes> =
  ZTypeName<T> extends keyof PrimitiveMap ? any : never;

// Types must match the exported zerialize function's implementation
export type Zerialize<T extends ZodTypes> =
  // Modifier types
  T extends z.ZodOptional<infer I>
    ? Zerialize<I> & SzOptional
    : T extends z.ZodNullable<infer I>
    ? Zerialize<I> & SzNullable
    : T extends z.ZodDefault<infer I>
    ? Zerialize<I> & SzDefault<I["_type"]>
    : T extends z.ZodReadonly<infer I>
    ? Zerialize<I> & SzReadonly
    : // Primitives
    T extends IsZodPrimitive<T>
    ? { type: PrimitiveMap[ZTypeName<T>] }
    : //
    T extends z.ZodLiteral<infer T>
    ? SzLiteral<T>
    : // List Collections
    T extends z.ZodTuple<infer Items>
    ? {
        [Index in keyof Items]: Zerialize<Items[Index]>;
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
    ? SzUnknown
    : // Union/Intersection
    T extends z.ZodUnion<infer Options>
    ? {
        [Index in keyof Options]: Zerialize<Options[Index]>;
      } extends infer SzOptions extends [SzType, ...SzType[]]
      ? SzUnion<SzOptions>
      : SzType
    : T extends z.ZodDiscriminatedUnion<infer Discriminator, infer Options>
    ? SzDiscriminatedUnion<
        Discriminator,
        {
          [Index in keyof Options]: Zerialize<Options[Index]>;
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
    : T extends z.ZodEffects<infer T>
    ? SzEffect<Zerialize<T>>
    : // Unserializable types, fallback to serializing inner type
    T extends z.ZodLazy<infer T>
    ? Zerialize<T>
    : T extends z.ZodBranded<infer T, infer _Brand>
    ? Zerialize<T>
    : T extends z.ZodPipeline<infer _In, infer Out>
    ? Zerialize<Out>
    : T extends z.ZodCatch<infer Inner>
    ? Zerialize<Inner>
    : SzType;

type ZodTypeMap = {
  [Key in ZTypeName<ZodTypes>]: Extract<ZodTypes, { _def: { typeName: Key } }>;
};

type ZerializerOptions = {
  superRefinements?: {
    [key: string]: (value: any, ctx: z.RefinementCtx) => Promise<void> | void;
  };
  transforms?: {
    [key: string]: (
      value: any,
      ctx: z.RefinementCtx
    ) => Promise<unknown> | unknown;
  };
  preprocesses?: {
    [key: string]: (value: any, ctx: z.RefinementCtx) => unknown;
  };
  paths: string[];
  pathMap: WeakMap<z.ZodTypeDef, string[]>;
};

type ZerializersMap = {
  [Key in ZTypeName<ZodTypes>]: (
    def: ZodTypeMap[Key]["_def"],
    opts: ZerializerOptions
  ) => any; //Zerialize<ZodTypeMap[Key]>;
};

const s = zerializeRefs as any;
const zerializers = {
  ZodOptional: (def, opts) => ({ ...s(def.innerType, opts), isOptional: true }),
  ZodNullable: (def, opts) => ({ ...s(def.innerType, opts), isNullable: true }),
  ZodDefault: (def, opts) => ({
    ...s(def.innerType, opts),
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
          ? {
              finite: true,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    );
    return Object.assign(
      { type: "number", ...checks },
      def.coerce ? { coerce: true } : {}
    );
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
          : check.kind == "toLowerCase"
          ? { toLowerCase: true }
          : check.kind == "toUpperCase"
          ? { toUpperCase: true }
          : check.kind == "trim"
          ? { trim: true }
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
          : check.kind == "time"
          ? {
              kind: "time",
              ...(typeof check.precision === "number"
                ? { precision: check.precision }
                : {}),
            }
          : check.kind == "datetime"
          ? {
              kind: "datetime",
              ...(check.offset ? { offset: check.offset } : {}),
              ...("local" in check && check.local
                ? { local: check.local }
                : {}),
              ...(typeof check.precision === "number"
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
    );
    return Object.assign(
      { type: "string", ...checks },
      def.coerce ? { coerce: true } : {}
    );
  },
  ZodBoolean: (def) =>
    Object.assign({ type: "boolean" }, def.coerce ? { coerce: true } : {}),
  ZodNaN: () => ({ type: "nan" }),
  ZodSymbol: (def) => ({ type: "symbol" }),
  ZodBigInt: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? {
              min: String(check.value),
              ...(check.inclusive ? { minInclusive: true } : {}),
            }
          : check.kind == "max"
          ? {
              max: String(check.value),
              ...(check.inclusive ? { maxInclusive: true } : {}),
            }
          : check.kind == "multipleOf"
          ? {
              multipleOf: String(check.value),
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    );
    return Object.assign(
      { type: "bigInt", ...checks },
      def.coerce ? { coerce: true } : {}
    );
  },
  ZodDate: (def) => {
    const checks = def.checks.reduce(
      (o, check) => ({
        ...o,
        ...(check.kind == "min"
          ? { min: check.value }
          : check.kind == "max"
          ? {
              max: check.value,
              /* c8 ignore next 2 -- Guard */
            }
          : {}),
      }),
      {}
    );
    return Object.assign(
      { type: "date", ...checks },
      def.coerce ? { coerce: true } : {}
    );
  },
  ZodUndefined: () => ({ type: "undefined" }),
  ZodNull: () => ({ type: "null" }),
  ZodAny: () => ({ type: "any" }),
  ZodUnknown: () => ({ type: "unknown" }),
  ZodNever: () => ({ type: "never" }),
  ZodVoid: () => ({ type: "void" }),

  ZodLiteral: (def) => ({ type: "literal", value: def.value }),

  ZodTuple: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    const restPaths = [...opts.paths];
    opts.paths.push("items");

    return {
      type: "tuple",
      items: def.items.map((item: ZodTypes, idx: number) =>
        s(item, {
          ...opts,
          paths: [...opts.paths, String(idx)],
        })
      ),
      ...(def.rest
        ? {
            rest: s(def.rest, {
              ...opts,
              paths: [...restPaths, "rest"],
            }),
          }
        : {}),
    };
  },
  ZodSet: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("value");

    return {
      type: "set",
      value: s(def.valueType, opts),
      ...(def.minSize === null ? {} : { minSize: def.minSize.value }),
      ...(def.maxSize === null ? {} : { maxSize: def.maxSize.value }),
    };
  },
  ZodArray: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("element");

    return {
      type: "array",
      element: s(def.type, opts),

      ...(def.exactLength === null
        ? {}
        : {
            minLength: def.exactLength.value,
            maxLength: def.exactLength.value,
          }),
      ...(def.minLength === null ? {} : { minLength: def.minLength.value }),
      ...(def.maxLength === null ? {} : { maxLength: def.maxLength.value }),
    };
  },

  ZodObject: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("properties");

    return {
      type: "object",
      ...(def.unknownKeys === "strip"
        ? {}
        : {
            unknownKeys: def.unknownKeys,
          }),
      properties: Object.fromEntries(
        Object.entries(def.shape()).map(([key, value]) => [
          key,
          s(value as ZodTypes, {
            ...opts,
            paths: [...opts.paths, key],
          }),
        ])
      ),
    };
  },
  ZodRecord: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);

    return {
      type: "record",
      key: s(def.keyType, {
        ...opts,
        paths: [...opts.paths, "key"],
      }),
      value: s(def.valueType, {
        ...opts,
        paths: [...opts.paths, "value"],
      }),
    };
  },
  ZodMap: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);

    return {
      type: "map",
      key: s(def.keyType, {
        ...opts,
        paths: [...opts.paths, "key"],
      }),
      value: s(def.valueType, {
        ...opts,
        paths: [...opts.paths, "value"],
      }),
    };
  },

  ZodEnum: (def) => ({ type: "enum", values: def.values }),
  // TODO: turn into enum
  ZodNativeEnum: () => ({ type: "unknown" }),

  ZodUnion: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("options");

    return {
      type: "union",
      options: def.options.map((opt, idx) =>
        s(opt, {
          ...opts,
          paths: [...opts.paths, idx],
        })
      ),
    };
  },
  ZodDiscriminatedUnion: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("options");

    return {
      type: "discriminatedUnion",
      discriminator: def.discriminator,
      options: def.options.map((opt, idx) =>
        s(opt, {
          ...opts,
          paths: [...opts.paths, String(idx)],
        })
      ),
    };
  },
  ZodIntersection: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);

    return {
      type: "intersection",
      left: s(def.left, {
        ...opts,
        paths: [...opts.paths, "left"],
      }),
      right: s(def.right, {
        ...opts,
        paths: [...opts.paths, "right"],
      }),
    };
  },

  ZodFunction: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);

    return {
      type: "function",
      args: s(def.args, {
        ...opts,
        paths: [...opts.paths, "args"],
      }),
      returns: s(def.returns, {
        ...opts,
        paths: [...opts.paths, "returns"],
      }),
    };
  },
  ZodPromise: (def, opts) => {
    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("value");

    return { type: "promise", value: s(def.type, opts) };
  },

  ZodLazy: (def, opts) => {
    return s(def.getter(), opts);
  },
  ZodEffects: (def, opts) => {
    if (
      !(
        "superRefinements" in opts ||
        "transforms" in opts ||
        "preprocesses" in opts
      )
    ) {
      return s(def.schema, opts);
    }

    const effects = [];

    let lastDef;
    let d = def;
    do {
      lastDef = d;

      let found;
      if ("superRefinements" in opts && opts.superRefinements) {
        for (const [name, refinement] of Object.entries(
          opts.superRefinements
        )) {
          if (
            d.effect.type === "refinement" &&
            refinement === d.effect.refinement
          ) {
            effects.unshift({ type: "refinement", name });
            found = true;
            break;
          }
        }
      }

      if (!found && "transforms" in opts && opts.transforms) {
        for (const [name, transform] of Object.entries(opts.transforms)) {
          if (
            d.effect.type === "transform" &&
            transform === d.effect.transform
          ) {
            effects.unshift({ type: "transform", name });
            found = true;
            break;
          }
        }
      }

      if (!found && "preprocesses" in opts && opts.preprocesses) {
        for (const [name, preprocess] of Object.entries(opts.preprocesses)) {
          if (
            d.effect.type === "preprocess" &&
            preprocess === d.effect.transform
          ) {
            effects.unshift({ type: "preprocess", name });
            found = true;
            break;
          }
        }
      }

      d = d.schema._def;
    } while (d && d.typeName === "ZodEffects");

    opts.pathMap.set(def, [...opts.paths]);
    opts.paths.push("inner");

    return {
      type: "effect",
      effects,
      inner: s(lastDef.schema, opts),
    };
  },
  ZodBranded: (def, opts) => s(def.type, opts),
  ZodPipeline: (def, opts) => s(def.out, opts),
  ZodCatch: (def, opts) => s(def.innerType, opts),
  ZodReadonly: (def, opts) => ({ ...s(def.innerType, opts), readonly: true }),
} satisfies ZerializersMap as ZerializersMap;

// Must match the exported Zerialize types
export function zerializeRefs<T extends ZodTypes>(
  schema: T,
  opts: ZerializerOptions
): Zerialize<T> | SzRef {
  // export function zerialize(schema: ZodTypes, opts?: Partial<ZerializerOptions> | undefined): unknown {

  const { _def: def } = schema;

  if (opts.pathMap.has(def)) {
    const pathMap = opts.pathMap.get(def) as string[];
    // @ts-expect-error Type instantiation not actually infinite
    return {
      $ref: "#" + (pathMap.length ? "/" + pathMap.join("/") : ""),
    };
  }

  opts.pathMap.set(def, []);

  const zer = zerializers[def.typeName](def as any, opts as ZerializerOptions);

  if (typeof def.description === "string") {
    zer.description = def.description;
  }

  return zer;
}

export function zerialize<T extends ZodTypes>(
  schema: T,
  opts: Partial<ZerializerOptions> = {}
): Zerialize<T> {
  if (!opts.paths) {
    opts.paths = [];
  }
  if (!opts.pathMap) {
    opts.pathMap = new WeakMap();
  }

  return zerializeRefs(schema, opts as ZerializerOptions) as Zerialize<T>;
}
