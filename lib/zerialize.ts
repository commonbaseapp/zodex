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
  SzEnum,
  SzPromise,
  // SzNumber,
  SzPipe,
  SzCatch,
  SzReadonly,
  SzPrimitive,
  SzType,
  // SzUnknown,
  // NUMBER_FORMATS,
  STRING_KINDS,
  SzRef,
  SzString,
  SzNumber,
  SzSymbol,
  SzExtras,
  SzKey,
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

// Helper type to extract SomeType from Zod 4
type SomeType = z.core.SomeType;

// Types must match the exported zerialize function's implementation
export type Zerialize<T extends ZodTypes> =
  // Modifier types
  T extends z.ZodOptional<infer I extends SomeType>
    ? Zerialize<I extends ZodTypes ? I : never> & SzOptional
    : T extends z.ZodNullable<infer I extends SomeType>
      ? Zerialize<I extends ZodTypes ? I : never> & SzNullable
      : T extends z.ZodDefault<infer I extends SomeType>
        ? Zerialize<I extends ZodTypes ? I : never> &
            SzDefault<z.core.output<I>>
        : T extends z.ZodReadonly<infer I extends SomeType>
          ? Zerialize<I extends ZodTypes ? I : never> & SzReadonly
          : // Primitives
            T extends IsZodPrimitive<T>
            ? { type: PrimitiveMap[ZTypeName<T>] }
            : //
              T extends z.ZodLiteral<infer T>
              ? SzLiteral<T>
              : // List Collections
                T extends z.ZodTuple<infer Items, any>
                ? {
                    [Index in keyof Items]: Items[Index] extends ZodTypes
                      ? Zerialize<Items[Index]>
                      : SzType;
                  } extends infer SzItems extends [SzType, ...SzType[]] | []
                  ? SzTuple<SzItems>
                  : SzType
                : T extends z.ZodSet<infer T extends SomeType>
                  ? SzSet<T extends ZodTypes ? Zerialize<T> : SzType>
                  : T extends z.ZodArray<infer T extends SomeType>
                    ? SzArray<T extends ZodTypes ? Zerialize<T> : SzType>
                    : T extends z.ZodPipe<
                          infer T extends SomeType,
                          infer U extends SomeType
                        >
                      ? SzPipe<
                          T extends ZodTypes ? Zerialize<T> : SzType,
                          U extends ZodTypes ? Zerialize<U> : SzType
                        >
                      : // Key/Value Collections
                        T extends z.ZodObject<infer Properties>
                        ? SzObject<{
                            [Property in keyof Properties]: Properties[Property] extends ZodTypes
                              ? Zerialize<Properties[Property]>
                              : SzType;
                          }>
                        : T extends z.ZodRecord<
                              infer Key,
                              infer Value extends SomeType
                            >
                          ? SzRecord<
                              Key extends z.ZodString
                                ? SzString & SzExtras
                                : Key extends z.ZodNumber
                                  ? SzNumber & SzExtras
                                  : Key extends z.ZodSymbol
                                    ? SzSymbol & SzExtras
                                    : Key extends z.ZodLiteral<
                                          infer L extends
                                            | string
                                            | number
                                            | bigint
                                            | boolean
                                            | null
                                            | undefined
                                        >
                                      ? SzLiteral<L> & SzExtras
                                      : Key extends z.ZodEnum<infer E>
                                        ? SzEnum<E> & SzExtras
                                        : SzKey,
                              Value extends ZodTypes ? Zerialize<Value> : SzType
                            >
                          : T extends z.ZodMap<
                                infer Key extends SomeType,
                                infer Value extends SomeType
                              >
                            ? SzMap<
                                Key extends ZodTypes ? Zerialize<Key> : SzType,
                                Value extends ZodTypes
                                  ? Zerialize<Value>
                                  : SzType
                              >
                            : // Enums
                              T extends z.ZodEnum<infer Values>
                              ? SzEnum<Values>
                              : // Union/Intersection
                                T extends z.ZodUnion<infer Options>
                                ? {
                                    [Index in keyof Options]: Options[Index] extends ZodTypes
                                      ? Zerialize<Options[Index]>
                                      : SzType;
                                  } extends infer SzOptions extends [
                                    SzType,
                                    ...SzType[],
                                  ]
                                  ? SzUnion<SzOptions>
                                  : SzType
                                : T extends z.ZodDiscriminatedUnion<
                                      infer Options
                                    >
                                  ? T["_zod"]["def"]["discriminator"] extends infer Discriminator extends
                                      string
                                    ? SzDiscriminatedUnion<
                                        Discriminator,
                                        {
                                          [Index in keyof Options]: Options[Index] extends ZodTypes
                                            ? Zerialize<Options[Index]>
                                            : SzType;
                                        } extends infer O extends
                                          readonly SzType[]
                                          ? O
                                          : never
                                      >
                                    : SzType
                                  : T extends z.ZodIntersection<
                                        infer L extends SomeType,
                                        infer R extends SomeType
                                      >
                                    ? SzIntersection<
                                        L extends ZodTypes
                                          ? Zerialize<L>
                                          : SzType,
                                        R extends ZodTypes
                                          ? Zerialize<R>
                                          : SzType
                                      >
                                    : // Specials
                                      T extends z.ZodPromise<
                                          infer Value extends SomeType
                                        >
                                      ? SzPromise<
                                          Value extends ZodTypes
                                            ? Zerialize<Value>
                                            : SzType
                                        >
                                      : T extends z.ZodCatch<
                                            infer T extends SomeType
                                          >
                                        ? SzCatch<
                                            T extends ZodTypes
                                              ? Zerialize<T>
                                              : SzType
                                          >
                                        : // Unserializable types, fallback to serializing inner type
                                          T extends z.ZodLazy<
                                              infer T extends SomeType
                                            >
                                          ? T extends ZodTypes
                                            ? Zerialize<T>
                                            : SzType
                                          : T extends z.ZodPipe<
                                                infer _In,
                                                infer Out extends SomeType
                                              >
                                            ? Out extends ZodTypes
                                              ? Zerialize<Out>
                                              : SzType
                                            : T extends z.ZodCatch<
                                                  infer Inner extends SomeType
                                                >
                                              ? Inner extends ZodTypes
                                                ? Zerialize<Inner>
                                                : SzType
                                              : SzType;

type ZodTypeMap = {
  [Key in ZTypeName<ZodTypes>]: Extract<
    ZodTypes,
    { _zod: { def: { type: Key } } }
  >;
};

type ZerializerOptions = {
  errors?: {
    [key: string]: z.core.$ZodErrorMap;
  };
  checks?: {
    [key: string]: (ctx: z.core.ParsePayload<any>) => Promise<void> | void;
  };
  transforms?: {
    [key: string]: (ctx: z.core.ParsePayload) => Promise<unknown> | unknown;
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

const getCustomChecksAndErrors = (
  def: {
    checks?: z.core.$ZodCheck[];
    error?: any;
  },
  opts: ZerializerOptions,
) => {
  let customChecks = null;
  if ("checks" in opts && opts.checks) {
    customChecks = def.checks
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

  let customError;
  if ("error" in def) {
    const key = Object.entries(opts.errors ?? {}).find(([, func]) => {
      return func === def.error;
    })?.[0];
    customError =
      typeof key == "string"
        ? { key }
        : // Not supplying an issue should not be a problem for regular
          //   wrapped string errors
          def.error();
  }

  return Object.assign(
    customChecks ? { checks: customChecks } : {},
    customError ? { error: customError } : {},
  );
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
      def.innerType._zod.def.type === "bigint"
        ? String(def.defaultValue)
        : def.innerType._zod.def.type === "date"
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
        ...getCustomChecksAndErrors(def, opts),
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
      ...(def.format ? { format: def.format } : {}),
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
        ...getCustomChecksAndErrors(def, opts),
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
        ...getCustomChecksAndErrors(def, opts),
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
      { type: "date", ...checks, ...getCustomChecksAndErrors(def, opts) },
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
    ...getCustomChecksAndErrors(def, opts),
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
      ...getCustomChecksAndErrors(def, opts),
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
      ...getCustomChecksAndErrors(def, opts),
      ...checks,
    };
  },

  object: (def, opts) => {
    return {
      type: "object",
      ...getCustomChecksAndErrors(def, opts),
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
    ...getCustomChecksAndErrors(def, opts),
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
    ...getCustomChecksAndErrors(def, opts),
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
      ...getCustomChecksAndErrors(def, opts),
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
    ...getCustomChecksAndErrors(def, opts),
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
    const getter = def.getter() as ZodTypes;
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
      ...getCustomChecksAndErrors(def, opts),
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
