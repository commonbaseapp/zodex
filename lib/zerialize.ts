import { z } from "zod/v4";
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
  SzEnum,
  SzPromise,
  // SzNumber,
  SzPipe,
  SzCatch,
  SzReadonly,
  SzPrimitive,
  SzType,
  // SzUnknown,
  NUMBER_FORMATS,
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
} as const satisfies Readonly<Partial<Record<string, SzPrimitive["type"]>>>;
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
                    : T extends z.ZodPipe<infer T, infer U>
                      ? SzPipe<T, U>
                      : // Key/Value Collections
                        T extends z.ZodObject<infer Properties>
                        ? SzObject<{
                            [Property in keyof Properties]: Zerialize<
                              Properties[Property]
                            >;
                          }>
                        : T extends z.ZodRecord<infer Key, infer Value>
                          ? SzRecord<Zerialize<Key>, Zerialize<Value>>
                          : T extends z.ZodMap<infer Key, infer Value>
                            ? SzMap<Zerialize<Key>, Zerialize<Value>>
                            : // Enums
                              T extends z.ZodEnum<infer Values>
                              ? SzEnum<Values>
                              : // Union/Intersection
                                T extends z.ZodUnion<infer Options>
                                ? {
                                    [Index in keyof Options]: Zerialize<
                                      Options[Index]
                                    >;
                                  } extends infer SzOptions extends [
                                    SzType,
                                    ...SzType[],
                                  ]
                                  ? SzUnion<SzOptions>
                                  : SzType
                                : T extends z.ZodDiscriminatedUnion<
                                      infer Discriminator,
                                      infer Options
                                    >
                                  ? SzDiscriminatedUnion<
                                      Discriminator,
                                      {
                                        [Index in keyof Options]: Zerialize<
                                          Options[Index]
                                        >;
                                      }
                                    >
                                  : T extends z.ZodIntersection<
                                        infer L,
                                        infer R
                                      >
                                    ? SzIntersection<Zerialize<L>, Zerialize<R>>
                                    : // Specials
                                      T extends z.ZodPromise<infer Value>
                                      ? SzPromise<Zerialize<Value>>
                                      : T extends z.ZodCatch<infer T>
                                        ? SzCatch<Zerialize<T>>
                                        : // Unserializable types, fallback to serializing inner type
                                          T extends z.ZodLazy<infer T>
                                          ? Zerialize<T>
                                          : T extends z.ZodPipe<
                                                infer _In,
                                                infer Out
                                              >
                                            ? Zerialize<Out>
                                            : T extends z.ZodCatch<infer Inner>
                                              ? Zerialize<Inner>
                                              : SzType;

type ZodTypeMap = {
  [Key in ZTypeName<ZodTypes>]: Extract<ZodTypes, { def: { type: Key } }>;
};

type ZerializerOptions = {
  checks?: {
    [key: string]: (ctx: z.core.ParsePayload<any>) => Promise<void> | void;
  };
  transforms?: {
    [key: string]: (
      value: any,
      ctx: z.RefinementCtx,
    ) => Promise<unknown> | unknown;
  };
  currentPath: string[];
  seenObjects: WeakMap<ZodTypes, string>;
};

type ZerializersMap = {
  [Key in ZTypeName<ZodTypes>]: (
    def: ZodTypeMap[Key]["def"],
    opts: ZerializerOptions,
  ) => any; //Zerialize<ZodTypeMap[Key]>;
};

const getCustomChecks = (def: any, opts: ZerializerOptions) => {
  let customChecks = null;
  if ("checks" in opts && opts.checks) {
    customChecks = (def.checks as z.core.$ZodCheck[])
      ?.filter((check) => {
        const chk = check._zod.def.check;
        return chk == "custom";
      })
      .map((check) => {
        const name = Object.entries(
          /* c8 ignore next -- TS doesn't catch */
          opts.checks || {},
        ).find(([, checkFunc]) => {
          return checkFunc === (check as z.core.$ZodCustom)._zod.check;
        })?.[0];
        if (name) {
          return { name };
        }

        // May be a refinement
        return null;
      })
      .filter(Boolean);
  }

  return customChecks ? { checks: customChecks } : {};
};

const s = zerializeRefs as any;
const zerializers = {
  optional: (def, opts) => ({
    ...s(def.innerType, opts, true),
    isOptional: true,
  }),
  nullable: (def, opts) => ({
    ...s(def.innerType, opts, true),
    isNullable: true,
  }),
  default: (def, opts) => ({
    ...s(def.innerType, opts, true),
    defaultValue:
      def.innerType.def.type === "bigint"
        ? String(def.defaultValue)
        : def.innerType.def.type === "date"
          ? (def.defaultValue as Date).getTime()
          : def.defaultValue,
  }),

  number: (def, opts) => {
    const checks = def.checks?.reduce((o, check) => {
      const chk = check._zod.def.check;
      const format = (check as z.core.$ZodCheckNumberFormat)._zod.def.format;
      return {
        ...o,
        ...(chk == "greater_than"
          ? {
              min: (check as z.core.$ZodCheckLessThan<number>)._zod.def.value,
              ...((check as z.core.$ZodCheckLessThan<number>)._zod.def.inclusive
                ? { minInclusive: true }
                : {}),
            }
          : chk == "less_than"
            ? {
                max: (check as z.core.$ZodCheckGreaterThan<number>)._zod.def
                  .value,
                ...((check as z.core.$ZodCheckLessThan<number>)._zod.def
                  .inclusive
                  ? { maxInclusive: true }
                  : {}),
              }
            : chk == "multiple_of"
              ? {
                  multipleOf: (check as z.core.$ZodCheckMultipleOf<number>)._zod
                    .def.value,
                  /* c8 ignore next 2 -- Guard */
                }
              : {}),
      };
    }, {});
    return Object.assign(
      {
        type: "number",
        ...checks,
        ...getCustomChecks(def, opts),
        // Check is on `def` itself
        ...("check" in def && def.check === "number_format" && "format" in def
          ? { format: def.format }
          : {}),
      },
      def.coerce ? { coerce: true } : {},
    );
  },
  template_literal: (def, opts) => {
    const parts = def.parts.map((part, idx) => {
      if (typeof part == "string") {
        return part;
      }
      return s(part, {
        ...opts,
        currentPath: [...opts.currentPath, "parts", String(idx)],
      });
    });
    return {
      type: "templateLiteral",
      parts,
    };
  },
  string: (def, opts) => {
    const checks = (def.checks as z.core.$ZodChecks[])?.reduce((o, check) => {
      const chk = check._zod.def.check;
      const format = (check as z.core.$ZodCheckStringFormat)._zod.def.format;

      return {
        ...o,
        ...(chk == "min_length"
          ? { min: (check as z.core.$ZodCheckMinLength)._zod.def.minimum }
          : chk == "max_length"
            ? { max: (check as z.core.$ZodCheckMaxLength)._zod.def.maximum }
            : chk == "length_equals"
              ? {
                  length: (check as z.core.$ZodCheckLengthEquals)._zod.def
                    .length,
                }
              : // Any way around this?
                chk === "overwrite" &&
                  check._zod.def.tx.toString() ===
                    "(input) => input.toUpperCase()"
                ? { toUpperCase: true }
                : chk === "overwrite" &&
                    check._zod.def.tx.toString() ===
                      "(input) => input.toLowerCase()"
                  ? { toLowerCase: true }
                  : chk === "overwrite" &&
                      check._zod.def.tx.toString() === "(input) => input.trim()"
                    ? { trim: true }
                    : // No apparent check
                      // : chk == "string_format" && format == "trim"
                      // ? { trim: true }
                      chk == "string_format" && format == "starts_with"
                      ? {
                          startsWith: (check as z.core.$ZodCheckStartsWith)._zod
                            .def.prefix,
                        }
                      : chk == "string_format" && format == "ends_with"
                        ? {
                            endsWith: (check as z.core.$ZodCheckEndsWith)._zod
                              .def.suffix,
                          }
                        : chk == "string_format" && format == "includes"
                          ? {
                              includes: (check as z.core.$ZodCheckIncludes)._zod
                                .def.includes,
                              position: (check as z.core.$ZodCheckIncludes)._zod
                                .def.position,
                            }
                          : chk == "string_format" && format == "regex"
                            ? {
                                regex: (check as z.core.$ZodCheckRegex)._zod.def
                                  .pattern.source,
                                ...((check as z.core.$ZodCheckRegex)._zod.def
                                  .pattern.flags
                                  ? {
                                      flags: (check as z.core.$ZodCheckRegex)
                                        ._zod.def.pattern.flags,
                                    }
                                  : {}),
                                /* c8 ignore next 2 -- Guard */
                              }
                            : {}),
      };
    }, {});

    const format = "format" in def && def.format;
    return Object.assign(
      {
        type: "string",
        ...checks,
        ...getCustomChecks(def, opts),
        // Check is on `def` itself
        ...(format == "ipv4"
          ? { kind: "ip", version: "v4" }
          : format == "ipv6"
            ? { kind: "ip", version: "v6" }
            : format == "cidrv4"
              ? { kind: "cidr", version: "v4" }
              : format == "cidrv6"
                ? { kind: "cidr", version: "v6" }
                : format == "uuid"
                  ? {
                      kind: "uuid",
                      ...("version" in def ? { version: def.version } : {}),
                    }
                  : format == "jwt"
                    ? {
                        kind: "jwt",
                        ...("alg" in def ? { algorithm: def.alg } : {}),
                      }
                    : format == "email"
                      ? {
                          kind: "email",
                          ...("pattern" in def &&
                          def.pattern &&
                          typeof def.pattern == "object" &&
                          "source" in def.pattern &&
                          "flags" in def.pattern &&
                          def.pattern.source !== z.regexes.email.source
                            ? {
                                pattern: def.pattern.source,
                                flags: def.pattern.flags,
                              }
                            : {}),
                        }
                      : ("format" in def && STRING_KINDS.has(format as any)) ||
                          format == "datetime" ||
                          format == "time"
                        ? {
                            kind: format,
                            ...("precision" in def && def.precision
                              ? {
                                  precision: def.precision,
                                }
                              : {}),
                            ...("offset" in def && def.offset
                              ? {
                                  offset: def.offset,
                                }
                              : {}),
                            ...("local" in def && def.local
                              ? {
                                  local: def.local,
                                }
                              : {}),
                          }
                        : {}),
      },
      def.coerce ? { coerce: true } : {},
    );
  },
  boolean: (def) =>
    Object.assign({ type: "boolean" }, def.coerce ? { coerce: true } : {}),
  nan: () => ({ type: "nan" }),
  symbol: () => ({ type: "symbol" }),
  bigint: (def, opts) => {
    const checks = def.checks?.reduce((o, check) => {
      const chk = check._zod.def.check;
      return {
        ...o,
        ...(chk == "greater_than"
          ? {
              min: String(
                (check as z.core.$ZodCheckLessThan<bigint>)._zod.def.value,
              ),
              ...((check as z.core.$ZodCheckLessThan<bigint>)._zod.def.inclusive
                ? { minInclusive: true }
                : {}),
            }
          : chk == "less_than"
            ? {
                max: String(
                  (check as z.core.$ZodCheckGreaterThan<bigint>)._zod.def.value,
                ),
                ...((check as z.core.$ZodCheckLessThan<bigint>)._zod.def
                  .inclusive
                  ? { maxInclusive: true }
                  : {}),
              }
            : chk == "multiple_of"
              ? {
                  multipleOf: String(
                    (check as z.core.$ZodCheckMultipleOf<bigint>)._zod.def
                      .value,
                  ),
                  /* c8 ignore next 2 -- Guard */
                }
              : {}),
      };
    }, {});
    return Object.assign(
      {
        type: "bigInt",
        ...checks,
        ...getCustomChecks(def, opts),
        // Check is on `def` itself
        ...("check" in def && def.check === "bigint_format" && "format" in def
          ? { format: def.format }
          : {}),
      },
      def.coerce ? { coerce: true } : {},
    );
  },
  file: (def) => {
    const checks = def.checks?.reduce((o, check) => {
      const chk = check._zod.def.check;
      return {
        ...o,
        ...(chk == "min_size"
          ? {
              min: (check as z.core.$ZodCheckMinSize<File>)._zod.def.minimum,
            }
          : chk == "max_size"
            ? {
                max: (check as z.core.$ZodCheckMaxSize<File>)._zod.def.maximum,
              }
            : chk == "mime_type"
              ? {
                  mime: (check as z.core.$ZodCheckMimeType<File>)._zod.def.mime,
                  /* c8 ignore next 2 -- Guard */
                }
              : {}),
      };
    }, {});
    return {
      type: "file",
      ...checks,
    };
  },
  date: (def, opts) => {
    const checks = def.checks?.reduce((o, check) => {
      const chk = check._zod.def.check;
      return {
        ...o,
        ...(chk == "greater_than"
          ? {
              min: (
                (check as z.core.$ZodCheckLessThan<Date>)._zod.def.value as Date
              ).getTime(),
              // ...((check as z.core.$ZodCheckLessThan<Date>)._zod.def.inclusive
              //   ? { minInclusive: true }
              //   : {}),
            }
          : chk == "less_than"
            ? {
                max: (
                  (check as z.core.$ZodCheckGreaterThan<Date>)._zod.def
                    .value as Date
                ).getTime(),
                // ...((check as z.core.$ZodCheckLessThan<Date>)._zod.def.inclusive
                //   ? { maxInclusive: true }
                //   : {}),
              }
            : /* c8 ignore next -- Guard */
              {}),
      };
    }, {});

    return Object.assign(
      { type: "date", ...checks, ...getCustomChecks(def, opts) },
      def.coerce ? { coerce: true } : {},
    );
  },
  undefined: () => ({ type: "undefined" }),
  null: () => ({ type: "null" }),
  any: () => ({ type: "any" }),
  unknown: () => ({ type: "unknown" }),
  never: () => ({ type: "never" }),
  void: () => ({ type: "void" }),

  literal: (def) => ({ type: "literal", values: def.values }),

  tuple: (def, opts) => ({
    type: "tuple",
    ...getCustomChecks(def, opts),
    items: def.items.map((item: ZodTypes, idx: number) => {
      const result = s(item, {
        ...opts,
        currentPath: [...opts.currentPath, "items", String(idx)],
      });
      return result;
    }),
    ...(def.rest
      ? {
          rest: s(def.rest, {
            ...opts,
            currentPath: [...opts.currentPath, "rest"],
          }),
        }
      : {}),
  }),
  set: (def, opts) => {
    const checks = def.checks?.reduce((o, check) => {
      const chk = check._zod.def.check;
      return {
        ...o,
        ...(chk == "min_size"
          ? {
              minSize: (check as z.core.$ZodCheckMinSize)._zod.def.minimum,
            }
          : chk == "max_size"
            ? {
                maxSize: (check as z.core.$ZodCheckMaxSize)._zod.def.maximum,
              }
            : chk == "size_equals"
              ? {
                  minSize: (check as z.core.$ZodCheckSizeEquals)._zod.def.size,
                  maxSize: (check as z.core.$ZodCheckSizeEquals)._zod.def.size,
                  /* c8 ignore next 2 -- Guard */
                }
              : {}),
      };
    }, {});
    return {
      type: "set",
      value: s(def.valueType, {
        ...opts,
        currentPath: [...opts.currentPath, "value"],
      }),
      ...getCustomChecks(def, opts),
      ...checks,
    };
  },
  array: (def, opts) => {
    const checks = (def.checks as z.core.$ZodChecks[])?.reduce((o, check) => {
      const chk = check._zod.def.check;
      return {
        ...o,
        ...(chk == "min_length"
          ? { minLength: (check as z.core.$ZodCheckMinLength)._zod.def.minimum }
          : chk == "max_length"
            ? {
                maxLength: (check as z.core.$ZodCheckMaxLength)._zod.def
                  .maximum,
              }
            : chk == "length_equals"
              ? {
                  minLength: (check as z.core.$ZodCheckLengthEquals)._zod.def
                    .length,
                  maxLength: (check as z.core.$ZodCheckLengthEquals)._zod.def
                    .length,
                  /* c8 ignore next 2 -- Guard */
                }
              : {}),
      };
    }, {});

    return {
      type: "array",
      element: s(def.element, {
        ...opts,
        currentPath: [...opts.currentPath, "element"],
      }),
      ...getCustomChecks(def, opts),
      ...checks,
    };
  },

  object: (def, opts) => {
    return {
      type: "object",
      ...getCustomChecks(def, opts),
      ...(!def.catchall
        ? {}
        : {
            catchall: s(def.catchall, {
              ...opts,
              currentPath: [...opts.currentPath, "catchall"],
            }),
          }),
      properties: Object.fromEntries(
        Object.entries(def.shape).map(([key, schema]) => [
          key,
          s(schema as ZodTypes, {
            ...opts,
            currentPath: [...opts.currentPath, "properties", key],
          }),
        ]),
      ),
    };
  },
  record: (def, opts) => ({
    type: "record",
    ...getCustomChecks(def, opts),
    key: s(def.keyType, {
      ...opts,
      currentPath: [...opts.currentPath, "key"],
    }),
    value: s(def.valueType, {
      ...opts,
      currentPath: [...opts.currentPath, "value"],
    }),
  }),
  map: (def, opts) => ({
    type: "map",
    ...getCustomChecks(def, opts),
    key: s(def.keyType, {
      ...opts,
      currentPath: [...opts.currentPath, "key"],
    }),
    value: s(def.valueType, {
      ...opts,
      currentPath: [...opts.currentPath, "value"],
    }),
  }),

  enum: (def) => ({ type: "enum", values: def.entries }),

  union: (def, opts) => {
    return {
      type: "discriminator" in def ? "discriminatedUnion" : "union",
      ...("discriminator" in def
        ? {
            discriminator: def.discriminator,
          }
        : {}),
      ...getCustomChecks(def, opts),
      // @ts-expect-error Not infinite
      options: def.options.map((opt, idx) => {
        const result = s(opt, {
          ...opts,
          currentPath: [...opts.currentPath, "options", String(idx)],
        });
        return result;
      }),
    };
  },
  intersection: (def, opts) => ({
    type: "intersection",
    ...getCustomChecks(def, opts),
    left: s(def.left, {
      ...opts,
      currentPath: [...opts.currentPath, "left"],
    }),
    right: s(def.right, {
      ...opts,
      currentPath: [...opts.currentPath, "right"],
    }),
  }),

  promise: (def, opts) => ({
    type: "promise",
    value: s(def.innerType, {
      ...opts,
      currentPath: [...opts.currentPath, "value"],
    }),
  }),

  lazy: (def, opts) => {
    const getter = def.getter();
    return s(
      getter,
      opts,
      // official equivalent for `isOptional`
      getter.safeParse(undefined).success ||
        // official equivalent for `isNullable`
        getter.safeParse(null).success,
    );
  },
  transform: (def, opts) => {
    let name = null;
    if ("transforms" in opts && opts.transforms) {
      for (const [transformName, transformItem] of Object.entries(
        opts.transforms,
      )) {
        if (def.type === "transform" && transformItem === def.transform) {
          name = transformName;
          break;
        }
      }
    }

    return {
      type: "transform",
      name,
      // inner: s(def.out, {
      //   ...opts,
      //   currentPath: [...opts.currentPath, "inner"],
      // }),
    };
  },
  pipe: (def, opts) => {
    if (!("transforms" in opts)) {
      return s(def.out, opts);
    }

    return {
      type: "pipe",
      ...getCustomChecks(def, opts),
      inner: s(def.in, opts),
      outer: s(def.out, opts),
    };
  },
  catch: (def, opts) => {
    const catchValue = def.catchValue({
      value: null,
      issues: [],
      // No errors to report, so just add an empty set
      /* c8 ignore next 3 -- Unused */
      get error() {
        return new z.ZodError([]);
      },
      // We don't have any input yet, so just provide `undefined`
      input: undefined,
    });

    return {
      type: "catch",
      value: catchValue,
      innerType: s(def.innerType, opts),
    };
  },
  readonly: (def, opts) => ({
    ...s(def.innerType, opts, true),
    readonly: true,
  }),
} satisfies ZerializersMap as ZerializersMap;

// Must match the exported Zerialize types
export function zerializeRefs<T extends ZodTypes>(
  schema: T,
  opts: ZerializerOptions,
  wrapReferences?: boolean,
): Zerialize<T> | SzRef {
  // export function zerialize(schema: ZodTypes, opts?: Partial<ZerializerOptions> | undefined): unknown {

  if (opts.seenObjects.has(schema)) {
    return wrapReferences // && schema._def.typeName !== "ZodOptional"
      ? ({
          type: "union",
          options: [{ $ref: opts.seenObjects.get(schema)! }],
          ...(typeof schema.description === "string"
            ? {
                description: schema.description,
              }
            : {}),
        } as any)
      : ({ $ref: opts.seenObjects.get(schema)! } as SzRef);
  }

  const {
    _zod: { def },
  } = schema;

  const objectPath =
    "#" + (opts.currentPath.length ? "/" + opts.currentPath.join("/") : "");

  opts.seenObjects.set(schema, objectPath);

  const zer = zerializers[def.type](def as any, opts as ZerializerOptions);

  if (typeof schema.description === "string") {
    zer.description = schema.description;
  }

  return zer;
}

export function zerialize<T extends ZodTypes>(
  schema: T,
  opts: Partial<ZerializerOptions> = {},
): Zerialize<T> {
  if (!opts.currentPath) {
    opts.currentPath = [];
  }
  if (!opts.seenObjects) {
    opts.seenObjects = new WeakMap();
  }

  return zerializeRefs(schema, opts as ZerializerOptions) as Zerialize<T>;
}
