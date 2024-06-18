import { expect, test } from "vitest";
import { z } from "zod";

import { dezerialize, SzType, zerialize, Zerialize } from "./index";

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
  p(z.boolean(), { type: "boolean", id: expect.any(Number) }),
  p(z.nan(), { type: "nan", id: expect.any(Number) }),
  p(z.null(), { type: "null", id: expect.any(Number) }),
  p(z.undefined(), { type: "undefined", id: expect.any(Number) }),
  p(z.any(), { type: "any", id: expect.any(Number) }),
  p(z.unknown(), { type: "unknown", id: expect.any(Number) }),
  p(z.never(), { type: "never", id: expect.any(Number) }),
  p(z.void(), { type: "void", id: expect.any(Number) }),
  p(z.nativeEnum(Fruits), { type: "unknown", id: expect.any(Number) }),
  p(z.object({ name: z.string() }).brand<"Cat">(), {
    type: "object",
    properties: {
      name: {
        type: "string",
        id: expect.any(Number),
      },
    },
    id: expect.any(Number),
  }),
  p(z.number().catch(42), { type: "number", id: expect.any(Number) }),

  p(z.string(), { type: "string", id: expect.any(Number) }),

  p(z.string().regex(/sth/), {
    type: "string",
    regex: "sth",
    id: expect.any(Number),
  }),
  p(z.string().min(3).max(7).regex(/sth/u), {
    type: "string",
    min: 3,
    max: 7,
    regex: "sth",
    flags: "u",
    id: expect.any(Number),
  }),

  p(z.string().length(10).startsWith("a").endsWith("z").includes("rst"), {
    type: "string",
    length: 10,
    startsWith: "a",
    endsWith: "z",
    includes: "rst",
    id: expect.any(Number),
  }),

  p(z.string().includes("special word", { position: 5 }), {
    type: "string",
    includes: "special word",
    position: 5,
    id: expect.any(Number),
  }),

  p(z.string().email(), {
    type: "string",
    kind: "email",
    id: expect.any(Number),
  }),
  p(z.string().url(), { type: "string", kind: "url", id: expect.any(Number) }),
  p(z.string().emoji(), {
    type: "string",
    kind: "emoji",
    id: expect.any(Number),
  }),
  p(z.string().uuid(), {
    type: "string",
    kind: "uuid",
    id: expect.any(Number),
  }),
  p(z.string().cuid(), {
    type: "string",
    kind: "cuid",
    id: expect.any(Number),
  }),
  p(z.string().cuid2(), {
    type: "string",
    kind: "cuid2",
    id: expect.any(Number),
  }),
  p(z.string().ulid(), {
    type: "string",
    kind: "ulid",
    id: expect.any(Number),
  }),
  p(z.string().ip(), { type: "string", kind: "ip", id: expect.any(Number) }),
  p(z.string().datetime(), {
    type: "string",
    kind: "datetime",
    id: expect.any(Number),
  }),

  p(z.string().ip({ version: "v4" }), {
    type: "string",
    kind: "ip",
    version: "v4",
    id: expect.any(Number),
  }),

  p(z.string().datetime({ offset: true, precision: 3 }), {
    type: "string",
    kind: "datetime",
    offset: true,
    precision: 3,
    id: expect.any(Number),
  }),

  p(z.number(), { type: "number", id: expect.any(Number) }),

  p(z.string().optional(), {
    type: "string",
    isOptional: true,
    id: expect.any(Number),
  }),
  p(z.string().nullable(), {
    type: "string",
    isNullable: true,
    id: expect.any(Number),
  }),

  p(z.string().default("foo"), {
    type: "string",
    defaultValue: "foo",
    id: expect.any(Number),
  }),
  p(z.string().optional().default("foo"), {
    type: "string",
    isOptional: true,
    defaultValue: "foo",
    id: expect.any(Number),
  }),

  p(z.number().default(42), {
    type: "number",
    defaultValue: 42,
    id: expect.any(Number),
  }),

  p(z.number().min(23).max(42).multipleOf(5), {
    type: "number",
    min: 23,
    minInclusive: true,
    max: 42,
    maxInclusive: true,
    multipleOf: 5,
    id: expect.any(Number),
  }),

  p(z.number().gt(14).lt(20), {
    type: "number",
    min: 14,
    max: 20,
    id: expect.any(Number),
  }),

  p(z.number().gte(14).lte(20), {
    type: "number",
    min: 14,
    minInclusive: true,
    max: 20,
    maxInclusive: true,
    id: expect.any(Number),
  }),

  p(z.number().positive(), {
    type: "number",
    min: 0,
    id: expect.any(Number),
  }),

  p(z.number().negative(), {
    type: "number",
    max: 0,
    id: expect.any(Number),
  }),

  p(z.number().nonnegative(), {
    type: "number",
    min: 0,
    minInclusive: true,
    id: expect.any(Number),
  }),

  p(z.number().nonpositive(), {
    type: "number",
    max: 0,
    maxInclusive: true,
    id: expect.any(Number),
  }),

  p(z.number().safe(), {
    type: "number",
    min: -9007199254740991,
    minInclusive: true,
    max: 9007199254740991,
    maxInclusive: true,
    id: expect.any(Number),
  }),

  p(z.number().int(), {
    type: "number",
    int: true,
    id: expect.any(Number),
  }),

  p(z.number().finite(), {
    type: "number",
    finite: true,
    id: expect.any(Number),
  }),

  p(z.bigint().min(BigInt(23)).max(BigInt(42)).multipleOf(BigInt(5)), {
    type: "bigInt",
    min: "23",
    minInclusive: true,
    max: "42",
    maxInclusive: true,
    multipleOf: "5",
    id: expect.any(Number),
  } as any),

  p(z.bigint().gt(14n).lt(20n), {
    type: "bigInt",
    min: "14",
    max: "20",
    id: expect.any(Number),
  }),

  p(z.bigint().gte(14n).lte(20n), {
    type: "bigInt",
    min: "14",
    minInclusive: true,
    max: "20",
    maxInclusive: true,
    id: expect.any(Number),
  }),

  p(z.bigint().positive(), {
    type: "bigInt",
    min: "0",
    id: expect.any(Number),
  }),

  p(z.bigint().negative(), {
    type: "bigInt",
    max: "0",
    id: expect.any(Number),
  }),

  p(z.bigint().nonnegative(), {
    type: "bigInt",
    min: "0",
    minInclusive: true,
    id: expect.any(Number),
  }),

  p(z.bigint().nonpositive(), {
    type: "bigInt",
    max: "0",
    maxInclusive: true,
    id: expect.any(Number),
  }),

  p(z.date().min(new Date("1999-01-01")).max(new Date("2001-12-31")), {
    type: "date",
    min: 915148800000,
    max: 1009756800000,
    id: expect.any(Number),
  }),

  p(z.object({ foo: z.string() }), {
    type: "object",
    properties: { foo: { type: "string", id: expect.any(Number) } },
    id: expect.any(Number),
  }),

  p(z.literal("Gregor"), {
    type: "literal",
    value: "Gregor",
    id: expect.any(Number),
  }),

  p(z.array(z.number()), {
    type: "array",
    element: { type: "number", id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(z.array(z.number()).min(3).max(10), {
    type: "array",
    element: { type: "number", id: expect.any(Number) },
    minLength: 3,
    maxLength: 10,
    id: expect.any(Number),
  }),

  p(z.array(z.number()).length(10), {
    type: "array",
    element: { type: "number", id: expect.any(Number) },
    minLength: 10,
    maxLength: 10,
    id: expect.any(Number),
  }),

  p(z.union([z.string(), z.number()]), {
    type: "union",
    options: [
      { type: "string", id: expect.any(Number) },
      { type: "number", id: expect.any(Number) },
    ],
    id: expect.any(Number),
  }),

  p(z.intersection(z.string(), z.number()), {
    type: "intersection",
    left: { type: "string", id: expect.any(Number) },
    right: { type: "number", id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(z.tuple([z.string(), z.number()]), {
    type: "tuple",
    items: [
      { type: "string", id: expect.any(Number) },
      { type: "number", id: expect.any(Number) },
    ],
    id: expect.any(Number),
  }),

  p(z.tuple([z.string(), z.number()]).rest(z.bigint()), {
    type: "tuple",
    items: [
      { type: "string", id: expect.any(Number) },
      { type: "number", id: expect.any(Number) },
    ],
    rest: {
      type: "bigInt",
      id: expect.any(Number),
    },
    id: expect.any(Number),
  }),

  p(z.set(z.string()), {
    type: "set",
    value: { type: "string", id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(z.set(z.string()).min(5).max(10), {
    type: "set",
    value: { type: "string", id: expect.any(Number) },
    minSize: 5,
    maxSize: 10,
    id: expect.any(Number),
  }),

  p(z.set(z.string()).size(5), {
    type: "set",
    value: { type: "string", id: expect.any(Number) },
    minSize: 5,
    maxSize: 5,
    id: expect.any(Number),
  }),

  p(z.record(z.string(), z.literal(42)), {
    type: "record",
    key: { type: "string", id: expect.any(Number) },
    value: { type: "literal", value: 42, id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(z.map(z.number(), z.string()), {
    type: "map",
    key: { type: "number", id: expect.any(Number) },
    value: { type: "string", id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(z.enum(["foo", "bar"]), {
    type: "enum",
    values: ["foo", "bar"],
    id: expect.any(Number),
  }),

  p(z.union([z.string(), z.number()]), {
    type: "union",
    options: [
      { type: "string", id: expect.any(Number) },
      { type: "number", id: expect.any(Number) },
    ],
    id: expect.any(Number),
  }),
  p(z.intersection(z.string(), z.number()), {
    type: "intersection",
    left: { type: "string", id: expect.any(Number) },
    right: { type: "number", id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(z.function(z.tuple([z.string()]), z.number()), {
    type: "function",
    args: {
      type: "tuple",
      items: [{ type: "string", id: expect.any(Number) }],
      id: expect.any(Number),
    },
    returns: { type: "number", id: expect.any(Number) },
    id: expect.any(Number),
  }),
  p(z.promise(z.string()), {
    type: "promise",
    value: { type: "string", id: expect.any(Number) },
    id: expect.any(Number),
  }),

  p(
    z.lazy(() => z.string().refine(() => true)),
    {
      type: "lazy",
      schema: { type: "string", id: expect.any(Number) },
      id: expect.any(Number),
    }
  ),

  p(
    z
      .number()
      .catch(23)
      .pipe(z.promise(z.literal(42))),
    {
      type: "promise",
      value: { type: "literal", value: 42, id: expect.any(Number) },
      id: expect.any(Number),
    }
  ),
] as const)("zerialize %#", (schema, shape) => {
  expect(zerialize(schema)).toEqual(expect.objectContaining(shape));
  expect(zerialize(dezerialize(shape) as any)).toEqual(
    expect.objectContaining(shape)
  );
});

test.each([
  p(z.string().optional(), {
    type: "string",
    isOptional: true,
    id: expect.any(Number),
  }),
  p(z.string().nullable(), {
    type: "string",
    isNullable: true,
    id: expect.any(Number),
  }),
])("isOptional/isNullable", (schema, shape) => {
  expect(zerialize(dezerialize(shape) as any)).toEqual(
    expect.objectContaining(shape)
  );
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
          name: { type: "literal", value: "Gregor", id: expect.any(Number) },
          age: { type: "number", isOptional: true, id: expect.any(Number) },
        },
        id: expect.any(Number),
      },
      {
        type: "object",
        properties: {
          name: { type: "literal", value: "Lea", id: expect.any(Number) },
          reach: { type: "number", id: expect.any(Number) },
        },
        id: expect.any(Number),
      },
    ],
    defaultValue: { name: "Lea", reach: 42 },
    id: expect.any(Number),
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
    id: expect.any(Number),
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
    id: expect.any(Number),
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
    id: expect.any(Number),
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
    id: expect.any(Number),
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
    id: expect.any(Number),
  });
  expect(dezerialize(shape as SzType).parse(0)).toEqual(false);
});

const schema = {
  type: "object",
  properties: {
    limit: { type: "number", coerce: true, id: 3, isOptional: true },
    offset: { type: "number", coerce: true, id: 5, isOptional: true },
    orderBy: {
      type: "array",
      element: {
        type: "object",
        properties: {
          id: {
            type: "object",
            properties: {
              isAsc: {
                type: "boolean",
                coerce: true,
                id: 12,
                isOptional: true,
              },
              isDesc: {
                type: "boolean",
                coerce: true,
                id: 14,
                isOptional: true,
              },
            },
            id: 10,
            isOptional: true,
          },
          test: { type: "ref", ref: 10 },
        },
        id: 9,
      },
      id: 7,
      isOptional: true,
    },
    id: {
      type: "object",
      properties: {
        isNull: {
          type: "boolean",
          coerce: true,
          id: 18,
          isOptional: true,
        },
        isNotNull: {
          type: "boolean",
          coerce: true,
          id: 20,
          isOptional: true,
        },
        eq: {
          type: "string",
          coerce: true,
          id: 22,
          isOptional: true,
        },
        ne: {
          type: "string",
          coerce: true,
          id: 24,
          isOptional: true,
        },
        gt: {
          type: "string",
          coerce: true,
          id: 26,
          isOptional: true,
        },
        gte: {
          type: "string",
          coerce: true,
          id: 28,
          isOptional: true,
        },
        lt: {
          type: "string",
          coerce: true,
          id: 30,
          isOptional: true,
        },
        lte: {
          type: "string",
          coerce: true,
          id: 32,
          isOptional: true,
        },
        like: {
          type: "string",
          coerce: true,
          id: 34,
          isOptional: true,
        },
        notLike: {
          type: "string",
          coerce: true,
          id: 36,
          isOptional: true,
        },
        ilike: {
          type: "string",
          coerce: true,
          id: 38,
          isOptional: true,
        },
        notIlike: {
          type: "string",
          coerce: true,
          id: 40,
          isOptional: true,
        },
        between: {
          type: "object",
          properties: {
            lower: { type: "string", coerce: true, id: 44 },
            upper: { type: "ref", ref: 44 },
          },
          id: 42,
          isOptional: true,
        },
        notBetween: {
          type: "object",
          properties: {
            lower: { type: "string", coerce: true, id: 47 },
            upper: { type: "ref", ref: 47 },
          },
          id: 45,
          isOptional: true,
        },
      },
      id: 16,
      isOptional: true,
    },
    test: { type: "ref", ref: 16 },
    and: {
      type: "array",
      element: {
        type: "lazy",
        schema: {
          type: "lazy",
          schema: {
            type: "object",
            properties: {
              id: { type: "ref", ref: 16 },
              test: { type: "ref", ref: 16 },
              and: {
                type: "array",
                element: {
                  type: "lazy",
                  schema: { type: "ref", ref: 51 },
                  id: 55,
                },
                id: 53,
                isOptional: true,
              },
              or: {
                type: "array",
                element: {
                  type: "lazy",
                  ref: { type: "ref", ref: 51 },
                  id: 58,
                },
                id: 56,
                isOptional: true,
              },
            },
            id: 52,
          },
          id: 51,
        },
        id: 50,
      },
      id: 48,
      isOptional: true,
    },
    or: {
      type: "array",
      element: {
        type: "lazy",
        ref: {
          type: "lazy",
          schema: {
            type: "object",
            properties: {
              id: { type: "ref", ref: 16 },
              test: { type: "ref", ref: 16 },
              and: {
                type: "array",
                element: {
                  type: "lazy",
                  schema: { type: "ref", ref: 51 },
                  id: 55,
                },
                id: 53,
                isOptional: true,
              },
              or: {
                type: "array",
                element: {
                  type: "lazy",
                  ref: { type: "ref", ref: 51 },
                  id: 58,
                },
                id: 56,
                isOptional: true,
              },
            },
            id: 52,
          },
          id: 51,
        },
        id: 61,
      },
      id: 59,
      isOptional: true,
    },
  },
  id: 1,
};

test("recursive zerialize and dezerialize", () => {
  // Convert the schema to a shape using zerialize
  const zodSchema = dezerialize(schema);
  const jsonSchema = zerialize(zodSchema);
  // console.log(shape);
  // Test that zerialize and dezerialize work correctly
  // expect(zerialize(shape)).toEqual(schema);
  // Verify that the default values are correctly deserialized
  // expect(
  //   (dezerialize(shape as SzType) as any).parse({
  //     limit: "10",
  //     orderBy: [{ id: { isAsc: "true" }, test: { isAsc: "false" } }],
  //     id: { eq: "123", between: { lower: "10", upper: "20" } },
  //     and: [{ limit: "5" }],
  //   })
  // ).toEqual({
  //   limit: 10,
  //   orderBy: [{ id: { isAsc: true }, test: { isAsc: false } }],
  //   id: { eq: "123", between: { lower: "10", upper: "20" } },
  //   and: [{ limit: 5 }],
  // });
});
