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

test.each([
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

  p(z.string().email(), { type: "string", kind: "email" }),
  p(z.string().url(), { type: "string", kind: "url" }),
  p(z.string().emoji(), { type: "string", kind: "emoji" }),
  p(z.string().uuid(), { type: "string", kind: "uuid" }),
  p(z.string().cuid(), { type: "string", kind: "cuid" }),
  p(z.string().cuid2(), { type: "string", kind: "cuid2" }),
  p(z.string().ulid(), { type: "string", kind: "ulid" }),
  p(z.string().ip(), { type: "string", kind: "ip" }),
  p(z.string().datetime(), { type: "string", kind: "datetime" }),

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

  p(z.number(), { type: "number" }),

  p(z.string().optional(), { type: "string", isOptional: true }),
  p(z.string().nullable(), { type: "string", isNullable: true }),

  p(z.string().default("foo"), { type: "string", defaultValue: "foo" }),
  p(z.number().default(42), { type: "number", defaultValue: 42 }),

  p(z.number().min(23).max(42).multipleOf(5), {
    type: "number",
    min: 23,
    max: 42,
    multipleOf: 5,
  }),

  p(z.number().safe(), {
    type: "number",
    min: -9007199254740991,
    max: 9007199254740991,
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
    min: BigInt(23),
    max: BigInt(42),
    multipleOf: BigInt(5),
  } as any),

  p(z.object({ foo: z.string() }), {
    type: "object",
    properties: { foo: { type: "string" } },
  }),

  p(z.literal("Gregor"), { type: "literal", value: "Gregor" }),

  p(z.tuple([z.string(), z.number()]), {
    type: "tuple",
    items: [{ type: "string" }, { type: "number" }],
  }),
  p(z.set(z.string()), { type: "set", value: { type: "string" } }),
  p(z.array(z.number()), { type: "array", element: { type: "number" } }),

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
] as const)("zerialize %#", (schema, shape) => {
  expect(zerialize(schema)).toEqual(shape);
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

  expect((dezerialize(shape) as z.ZodDefault<any>)._def.defaultValue()).toEqual(
    {
      name: "Lea",
      reach: 42,
    }
  );
});
