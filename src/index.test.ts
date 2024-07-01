import { expect, test } from "vitest";
import { z } from "zod";
import React from "react";

import {
  dezerialize,
  SzType,
  SzString,
  zerialize,
  Zerialize,
  mapTypesToViews,
} from "./index.js";

const p = <
  Schema extends z.ZodFirstPartySchemaTypes,
  Shape extends SzType = Zerialize<Schema>
>(
  schema: Schema,
  shape: Shape
): [Schema, Shape] => [schema, shape];

enum Fruits {
  Apple,
  Banana,
}

test.each([
  p(z.boolean(), { type: "boolean" }),
  p(z.nan(), { type: "nan" }),
  p(z.null(), { type: "null" }),
  p(z.undefined(), { type: "undefined" }),
  p(z.any(), { type: "any" }),
  p(z.unknown(), { type: "unknown" }),
  p(z.never(), { type: "never" }),
  p(z.void(), { type: "void" }),
  p(z.nativeEnum(Fruits), { type: "unknown" }),
  p(z.object({ name: z.string() }).brand<"Cat">(), {
    type: "object",
    properties: {
      name: {
        type: "string",
      },
    },
  }),
  p(z.number().catch(42), { type: "number" }),

  p(z.string(), { type: "string" }),

  p(z.string().regex(/sth/), { type: "string", regex: "sth" }),
  p(z.string().min(3).max(7).regex(/sth/u), {
    type: "string",
    min: 3,
    max: 7,
    regex: "sth",
    flags: "u",
  }),

  p(z.string().length(10).startsWith("a").endsWith("z").includes("rst"), {
    type: "string",
    length: 10,
    startsWith: "a",
    endsWith: "z",
    includes: "rst",
  }),

  p(z.string().includes("special word", { position: 5 }), {
    type: "string",
    includes: "special word",
    position: 5,
  }),

  p(z.string().toLowerCase(), { type: "string", toLowerCase: true }),
  p(z.string().toUpperCase(), { type: "string", toUpperCase: true }),
  p(z.string().trim(), { type: "string", trim: true }),

  p(z.string().email(), { type: "string", kind: "email" }),
  p(z.string().url(), { type: "string", kind: "url" }),
  p(z.string().emoji(), { type: "string", kind: "emoji" }),
  p(z.string().uuid(), { type: "string", kind: "uuid" }),
  p(z.string().nanoid(), { type: "string", kind: "nanoid" }),
  p(z.string().cuid(), { type: "string", kind: "cuid" }),
  p(z.string().cuid2(), { type: "string", kind: "cuid2" }),
  p(z.string().ulid(), { type: "string", kind: "ulid" }),
  p(z.string().ip(), { type: "string", kind: "ip" }),
  p(z.string().datetime(), { type: "string", kind: "datetime" }),
  p(z.string().datetime({ local: true }), {
    type: "string",
    kind: "datetime",
    local: true,
  }),

  p(z.string().date(), { type: "string", kind: "date" }),
  p(z.string().duration(), { type: "string", kind: "duration" }),
  p(z.string().base64(), { type: "string", kind: "base64" }),

  p(z.string().ip({ version: "v4" }), {
    type: "string",
    kind: "ip",
    version: "v4",
  }),

  p(z.string().datetime({ offset: true, precision: 3 }), {
    type: "string",
    kind: "datetime",
    offset: true,
    precision: 3,
  }),

  p(z.string().time(), {
    type: "string",
    kind: "time",
  }),
  p(z.string().time({ precision: 3 }), {
    type: "string",
    kind: "time",
    precision: 3,
  }),

  p(z.number(), { type: "number" }),

  p(z.string().optional(), { type: "string", isOptional: true }),
  p(z.string().nullable(), { type: "string", isNullable: true }),

  p(z.string().default("foo"), { type: "string", defaultValue: "foo" }),
  p(z.string().optional().default("foo"), {
    type: "string",
    isOptional: true,
    defaultValue: "foo",
  }),

  p(z.number().default(42), { type: "number", defaultValue: 42 }),

  p(z.number().min(23).max(42).multipleOf(5), {
    type: "number",
    min: 23,
    minInclusive: true,
    max: 42,
    maxInclusive: true,
    multipleOf: 5,
  }),

  p(z.number().gt(14).lt(20), {
    type: "number",
    min: 14,
    max: 20,
  }),

  p(z.number().gte(14).lte(20), {
    type: "number",
    min: 14,
    minInclusive: true,
    max: 20,
    maxInclusive: true,
  }),

  p(z.number().positive(), {
    type: "number",
    min: 0,
  }),

  p(z.number().negative(), {
    type: "number",
    max: 0,
  }),

  p(z.number().nonnegative(), {
    type: "number",
    min: 0,
    minInclusive: true,
  }),

  p(z.number().nonpositive(), {
    type: "number",
    max: 0,
    maxInclusive: true,
  }),

  p(z.number().safe(), {
    type: "number",
    min: -9007199254740991,
    minInclusive: true,
    max: 9007199254740991,
    maxInclusive: true,
  }),

  p(z.number().int(), {
    type: "number",
    int: true,
  }),

  p(z.number().finite(), {
    type: "number",
    finite: true,
  }),

  p(z.bigint().min(BigInt(23)).max(BigInt(42)).multipleOf(BigInt(5)), {
    type: "bigInt",
    min: "23",
    minInclusive: true,
    max: "42",
    maxInclusive: true,
    multipleOf: "5",
  } as any),

  p(z.bigint().gt(14n).lt(20n), {
    type: "bigInt",
    min: "14",
    max: "20",
  }),

  p(z.bigint().gte(14n).lte(20n), {
    type: "bigInt",
    min: "14",
    minInclusive: true,
    max: "20",
    maxInclusive: true,
  }),

  p(z.bigint().positive(), {
    type: "bigInt",
    min: "0",
  }),

  p(z.bigint().negative(), {
    type: "bigInt",
    max: "0",
  }),

  p(z.bigint().nonnegative(), {
    type: "bigInt",
    min: "0",
    minInclusive: true,
  }),

  p(z.bigint().nonpositive(), {
    type: "bigInt",
    max: "0",
    maxInclusive: true,
  }),

  p(z.date().min(new Date("1999-01-01")).max(new Date("2001-12-31")), {
    type: "date",
    min: 915148800000,
    max: 1009756800000,
  }),

  p(z.object({ foo: z.string() }), {
    type: "object",
    properties: { foo: { type: "string" } },
  }),

  p(z.object({}).readonly(), {
    type: "object",
    readonly: true,
    properties: {},
  }),

  p(z.literal("Gregor"), { type: "literal", value: "Gregor" }),

  p(z.symbol(), { type: "symbol" }),

  p(z.array(z.number()), {
    type: "array",
    element: { type: "number" },
  }),

  p(z.array(z.number()).min(3).max(10), {
    type: "array",
    element: { type: "number" },
    minLength: 3,
    maxLength: 10,
  }),

  p(z.array(z.number()).length(10), {
    type: "array",
    element: { type: "number" },
    minLength: 10,
    maxLength: 10,
  }),

  p(z.union([z.string(), z.number()]), {
    type: "union",
    options: [{ type: "string" }, { type: "number" }],
  }),

  p(z.intersection(z.string(), z.number()), {
    type: "intersection",
    left: { type: "string" },
    right: { type: "number" },
  }),

  p(z.tuple([z.string(), z.number()]), {
    type: "tuple",
    items: [{ type: "string" }, { type: "number" }],
  }),

  p(z.tuple([z.string(), z.number()]).rest(z.bigint()), {
    type: "tuple",
    items: [{ type: "string" }, { type: "number" }],
    rest: {
      type: "bigInt",
    },
  }),

  p(z.set(z.string()), { type: "set", value: { type: "string" } }),

  p(z.set(z.string()).min(5).max(10), {
    type: "set",
    value: { type: "string" },
    minSize: 5,
    maxSize: 10,
  }),

  p(z.set(z.string()).size(5), {
    type: "set",
    value: { type: "string" },
    minSize: 5,
    maxSize: 5,
  }),

  p(z.record(z.literal(42)), {
    type: "record",
    key: { type: "string" },
    value: { type: "literal", value: 42 },
  }),
  p(z.map(z.number(), z.string()), {
    type: "map",
    key: { type: "number" },
    value: { type: "string" },
  }),

  p(z.enum(["foo", "bar"]), {
    type: "enum",
    values: ["foo", "bar"],
  }),

  p(z.union([z.string(), z.number()]), {
    type: "union",
    options: [{ type: "string" }, { type: "number" }],
  }),
  p(z.intersection(z.string(), z.number()), {
    type: "intersection",
    left: { type: "string" },
    right: { type: "number" },
  }),

  p(
    z
      .object({
        a: z.string(),
      })
      .strict(),
    {
      type: "object",
      unknownKeys: "strict",
      properties: {
        a: {
          type: "string",
        },
      },
    }
  ),

  p(
    z
      .object({
        a: z.string(),
      })
      .passthrough(),
    {
      type: "object",
      unknownKeys: "passthrough",
      properties: {
        a: {
          type: "string",
        },
      },
    }
  ),

  p(z.function(z.tuple([z.string()]), z.number()), {
    type: "function",
    args: { type: "tuple", items: [{ type: "string" }] },
    returns: { type: "number" },
  }),
  p(z.promise(z.string()), { type: "promise", value: { type: "string" } }),

  p(
    z.lazy(() => z.string().refine(() => true)),
    { type: "string" }
  ),

  p(
    z
      .number()
      .catch(23)
      .pipe(z.promise(z.literal(42))),
    {
      type: "promise",
      value: { type: "literal", value: 42 },
    }
  ),
] as const)("zerialize %#", (schema, shape) => {
  expect(zerialize(schema)).toEqual(shape);
  expect(zerialize(dezerialize(shape) as any)).toEqual(zerialize(schema));
});

test.each([
  p(z.string(), { type: "string", isOptional: false }),
  p(z.string(), { type: "string", isNullable: false }),
  p(z.object({}), {
    type: "object",
    readonly: false,
    properties: {},
  }),
])("isOptional/isNullable/readonly", (schema, shape) => {
  expect(zerialize(dezerialize(shape) as any)).toEqual(zerialize(schema));
});

test("discriminated union", () => {
  const schema = z
    .discriminatedUnion("name", [
      z.object({ name: z.literal("Gregor"), age: z.number().optional() }),
      z.object({ name: z.literal("Lea"), reach: z.number() }),
    ])
    .default({ name: "Lea", reach: 42 });
  const shape = zerialize(schema);

  // type InfType = z.infer<Dezerialize<typeof shape>>;
  // ({}) as InfType satisfies
  //   | { name: "Gregor"; age?: number }
  //   | { name: "Lea"; reach: number };

  // ({ name: "Gregor" }) satisfies InfType;

  expect(shape).toEqual({
    type: "discriminatedUnion",
    discriminator: "name",
    options: [
      {
        type: "object",
        properties: {
          name: { type: "literal", value: "Gregor" },
          age: { type: "number", isOptional: true },
        },
      },
      {
        type: "object",
        properties: {
          name: { type: "literal", value: "Lea" },
          reach: { type: "number" },
        },
      },
    ],
    defaultValue: { name: "Lea", reach: 42 },
  });

  // expectTypeOf(shape).toMatchTypeOf<{
  //   type: "discriminatedUnion";
  //   discriminator: "name";
  //   options: [
  //     {
  //       type: "object";
  //       properties: {
  //         name: { type: "literal"; value: "Gregor" };
  //         age: { type: "number"; isOptional: true };
  //       };
  //     },
  //     {
  //       type: "object";
  //       properties: {
  //         name: { type: "literal"; value: "Lea" };
  //         reach: { type: "number" };
  //       };
  //     }
  //   ];
  // }>();

  expect(
    (dezerialize(shape as SzType) as z.ZodDefault<any>)._def.defaultValue()
  ).toEqual({
    name: "Lea",
    reach: 42,
  });
});

test("coerce (number)", () => {
  const schema = z.coerce.number();
  expect(schema.parse("42")).toEqual(42);
  const shape = zerialize(schema);
  expect(shape).toEqual({
    type: "number",
    coerce: true,
  });
  expect(dezerialize(shape as SzType).parse("42")).toEqual(42);
});

test("coerce (bigint)", () => {
  const schema = z.coerce.bigint();
  expect(schema.parse("42")).toEqual(42n);
  const shape = zerialize(schema);
  expect(shape).toEqual({
    type: "bigInt",
    coerce: true,
  });
  expect(dezerialize(shape as SzType).parse("42")).toEqual(42n);
});

test("coerce (date)", () => {
  const schema = z.coerce.date();
  expect(schema.parse("1999-01-01")).toEqual(new Date("1999-01-01"));
  const shape = zerialize(schema);
  expect(shape).toEqual({
    type: "date",
    coerce: true,
  });
  expect(dezerialize(shape as SzType).parse("1999-01-01")).toEqual(
    new Date("1999-01-01")
  );
});

test("coerce (string)", () => {
  const schema = z.coerce.string();
  expect(schema.parse(42)).toEqual("42");
  const shape = zerialize(schema);
  expect(shape).toEqual({
    type: "string",
    coerce: true,
  });
  expect(dezerialize(shape as SzType).parse(42)).toEqual("42");
});

test("coerce (boolean)", () => {
  const schema = z.coerce.boolean();
  expect(schema.parse(0)).toEqual(false);
  const shape = zerialize(schema);
  expect(shape).toEqual({
    type: "boolean",
    coerce: true,
  });
  expect(dezerialize(shape as SzType).parse(0)).toEqual(false);
});

test("named superrefinements and transforms", () => {
  const superRefinements = {
    "not in future": (d: Date, ctx: z.RefinementCtx) => {
      if (d > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: new Date().getTime(),
          message: "Not into the future",
          inclusive: false,
          type: "date",
        });
      }
    },
    "far too old": (val: Date, ctx: z.RefinementCtx) => {
      if (val < new Date("1970-01-01")) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: new Date("1970-01-01").getTime(),
          message: "Too old",
          inclusive: false,
          type: "date",
        });
      }
    },
    "far too young": (val: Date, ctx: z.RefinementCtx) => {
      if (val > new Date("2030-01-01")) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: new Date("2030-01-01").getTime(),
          message: "Too young",
          inclusive: false,
          type: "date",
        });
      }
    },
    BCE: (arg: Date) => arg < new Date("0001-01-01"),
  };

  const transforms = {
    earlier: (val) => new Date(new Date().getTime() - 60000),
  };

  const schema = z
    .date()
    .superRefine(superRefinements["not in future"])
    .refine(superRefinements["BCE"]) // Ignored by serialization
    .superRefine(superRefinements["far too old"])
    .transform(transforms.earlier)
    .superRefine(superRefinements["far too young"]);

  const expectedShape = {
    effects: [
      { type: "refinement", name: "not in future" },
      { type: "refinement", name: "far too old" },
      { type: "transform", name: "earlier" },
      { type: "refinement", name: "far too young" },
    ],
    inner: {
      type: "date",
    },
    type: "effect",
  };

  // @ts-expect-error BCE arg is deliberately bad
  const serialized = zerialize(schema, { superRefinements, transforms });
  expect(serialized).toEqual(expectedShape);

  // @ts-expect-error BCE arg is deliberately bad
  const dezSchema = dezerialize(serialized, { superRefinements, transforms });
  const res1 = dezSchema.safeParse(
    new Date(new Date().getTime() + 10000000)
  ) as z.SafeParseError<Date>;

  expect(res1.success).to.be.false;

  const res2 = dezSchema.safeParse(
    new Date("1969-01-01")
  ) as z.SafeParseError<Date>;

  expect(res2.success).to.be.false;

  const res3 = dezSchema.safeParse(
    new Date("2050-01-01")
  ) as z.SafeParseError<Date>;

  expect(res3.success).to.be.false;

  const res4 = dezSchema.safeParse(new Date()) as z.SafeParseSuccess<Date>;

  expect(res4.success).to.be.true;
  // Will be transformed down
  expect(res4.data.getTime()).toBeLessThan(new Date().getTime());
});

test("preprocess", () => {
  const preprocesses = {
    higher: (val: unknown) => (val as number) + 1000,
  };

  const schema = z.preprocess(preprocesses.higher, z.number());

  const expectedShape = {
    effects: [{ type: "preprocess", name: "higher" }],
    inner: {
      type: "number",
    },
    type: "effect",
  };

  const serialized = zerialize(schema, { preprocesses });
  expect(serialized).toEqual(expectedShape);

  const dezSchema = dezerialize(serialized, { preprocesses });
  const res1 = dezSchema.safeParse(500) as z.SafeParseSuccess<Date>;

  expect(res1.success).to.be.true;
  expect(res1.data).to.be.equal(1500);
});

test("dezerialize effects without options", () => {
  const superRefinements = {
    "not in future": (d: Date, ctx: z.RefinementCtx) => {
      if (d > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_big,
          maximum: new Date().getTime(),
          message: "Not into the future",
          inclusive: false,
          type: "date",
        });
      }
    },
  };
  const schema = z.date().superRefine(superRefinements["not in future"]);

  const expectedShape = {
    effects: [{ type: "refinement", name: "not in future" }],
    inner: {
      type: "date",
    },
    type: "effect",
  };

  const serialized = zerialize(schema, { superRefinements });
  expect(serialized).toEqual(expectedShape);

  const dezSchema = dezerialize(serialized);

  const res1 = dezSchema.safeParse(
    new Date(new Date().getTime() + 10000000)
  ) as z.SafeParseSuccess<Date>;

  expect(res1.success).to.be.true;
});

test("describe", () => {
  const schema = z.date().describe("Some description");

  const expectedShape = {
    type: "date",
    description: "Some description",
  };

  const serialized = zerialize(schema);
  expect(serialized).toEqual(expectedShape);

  const dezSchema = dezerialize(serialized);

  const res1 = dezSchema.safeParse(
    new Date(new Date().getTime() + 10000000)
  ) as z.SafeParseSuccess<Date>;

  expect(res1.success).to.be.true;
});

test("React", () => {
  const shapeControl = mapTypesToViews<SzString>({
    string: (props) => {
      return React.createElement("input", {
        value: props.value,
      });
    },
  });
  const element = shapeControl({
    shape: {
      type: "string",
    },
    value: "a string",
    onChange: () => {
      console.log("changed");
    },
  });

  expect(element.props.shape.type).to.equal("string");
});
