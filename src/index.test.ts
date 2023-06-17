import { expect, test } from "vitest";
import { z } from "zod";

import { getDefaultValue, SzInfer, zerialize } from "./";

const s = zerialize;
test.each([
  [s(z.string()) satisfies { type: "string" }, { type: "string" }],
  [s(z.number()) satisfies { type: "number" }, { type: "number" }],

  [s(z.string().regex(/sth/)), { type: "string", regex: "sth" }],
  [
    s(z.string().min(3).max(7).regex(/sth/u)),
    { type: "string", min: 3, max: 7, regex: "sth", flags: "u" },
  ],

  [
    s(z.string().length(10).startsWith("a").endsWith("z").includes("rst")),
    {
      type: "string",
      length: 10,
      startsWith: "a",
      endsWith: "z",
      includes: "rst",
    },
  ],

  [
    s(z.string().includes("special word", { position: 5 })),
    { type: "string", includes: "special word", position: 5 },
  ],

  [s(z.string().email()), { type: "string", kind: "email" }],
  [s(z.string().url()), { type: "string", kind: "url" }],
  [s(z.string().emoji()), { type: "string", kind: "emoji" }],
  [s(z.string().uuid()), { type: "string", kind: "uuid" }],
  [s(z.string().cuid()), { type: "string", kind: "cuid" }],
  [s(z.string().cuid2()), { type: "string", kind: "cuid2" }],
  [s(z.string().ulid()), { type: "string", kind: "ulid" }],
  [s(z.string().ip()), { type: "string", kind: "ip" }],
  [s(z.string().datetime()), { type: "string", kind: "datetime" }],

  [
    s(z.string().ip({ version: "v4" })),
    { type: "string", kind: "ip", version: "v4" },
  ],

  [
    s(z.string().datetime({ offset: true, precision: 3 })),
    { type: "string", kind: "datetime", offset: true, precision: 3 },
  ],

  [
    s(z.string().optional()) satisfies {
      type: "string";
      isOptional: true;
    },
    { type: "string", isOptional: true },
  ],
  [
    s(z.string().default("foo")) satisfies {
      type: "string";
      defaultValue: string;
    },
    { type: "string", defaultValue: "foo" },
  ],
  [
    s(z.string().optional().default("foo")) satisfies {
      type: "string";
      isOptional: true;
      defaultValue?: string | undefined;
    },
    { type: "string", isOptional: true, defaultValue: "foo" },
  ],
  [
    s(z.number().default(42)) satisfies {
      type: "number";
      defaultValue: number;
    },
    { type: "number", defaultValue: 42 },
  ],

  [
    s(z.number().min(23).max(42).multipleOf(5)),
    {
      type: "number",
      min: 23,
      max: 42,
      multipleOf: 5,
    },
  ],

  [
    s(z.number().safe()),
    {
      type: "number",
      min: -9007199254740991,
      max: 9007199254740991,
    },
  ],

  [
    s(z.number().int()),
    {
      type: "number",
      int: true,
    },
  ],

  [
    s(z.number().finite()),
    {
      type: "number",
      finite: true,
    },
  ],

  [
    s(z.bigint().min(23n).max(42n).multipleOf(5n)),
    {
      type: "bigInt",
      min: 23n,
      max: 42n,
      multipleOf: 5n,
    },
  ],

  [
    s(z.date().min(new Date("1999-01-01")).max(new Date("2001-12-31"))),
    { type: "date", min: 915148800000, max: 1009756800000 },
  ],

  [
    s(z.object({ foo: z.string() })) satisfies {
      type: "object";
      properties: { foo: { type: "string" } };
    },
    { type: "object", properties: { foo: { type: "string" } } },
  ],

  [
    s(z.literal("Gregor")) satisfies { type: "literal"; value: "Gregor" },
    { type: "literal", value: "Gregor" },
  ],

  [
    s(z.array(z.number())) satisfies {
      type: "array";
      element: { type: "number" };
    },
    { type: "array", element: { type: "number" } },
  ],

  [
    s(z.array(z.number()).min(3).max(10)),
    { type: "array", element: { type: "number" }, minLength: 3, maxLength: 10 },
  ],

  [
    s(z.array(z.number()).length(10)),
    {
      type: "array",
      element: { type: "number" },
      minLength: 10,
      maxLength: 10,
    },
  ],

  [
    s(z.union([z.string(), z.number()])) satisfies {
      type: "union";
      options: { type: "string" } | { type: "number" }[];
    },
    { type: "union", options: [{ type: "string" }, { type: "number" }] },
  ],

  [
    s(z.intersection(z.string(), z.number())) satisfies {
      type: "intersection";
      left: { type: "string" };
      right: { type: "number" };
    },
    {
      type: "intersection",
      left: { type: "string" },
      right: { type: "number" },
    },
  ],

  [
    s(z.tuple([z.string(), z.number()])) satisfies {
      type: "tuple";
      items: ({ type: "string" } | { type: "number" })[];
    },
    { type: "tuple", items: [{ type: "string" }, { type: "number" }] },
  ],

  [
    s(z.tuple([z.string(), z.number()]).rest(z.bigint())),
    {
      type: "tuple",
      items: [{ type: "string" }, { type: "number" }],
      rest: {
        type: "bigInt",
      },
    },
  ],

  [
    s(z.record(z.literal(42))) satisfies {
      type: "record";
      key: { type: "string" };
      value: { type: "literal"; value: 42 };
    },
    {
      type: "record",
      key: { type: "string" },
      value: { type: "literal", value: 42 },
    },
  ],

  [
    s(z.map(z.number(), z.string())) satisfies {
      type: "map";
      key: { type: "number" };
      value: { type: "string" };
    },
    { type: "map", key: { type: "number" }, value: { type: "string" } },
  ],

  [
    s(z.set(z.string())) satisfies { type: "set"; value: { type: "string" } },
    { type: "set", value: { type: "string" } },
  ],

  [
    s(z.set(z.string()).min(5).max(10)) satisfies {
      type: "set";
      value: { type: "string" };
    },
    { type: "set", value: { type: "string" }, minSize: 5, maxSize: 10 },
  ],

  [
    s(z.set(z.string()).size(5)) satisfies {
      type: "set";
      value: { type: "string" };
    },
    { type: "set", value: { type: "string" }, minSize: 5, maxSize: 5 },
  ],

  [
    s(z.function(z.tuple([z.string()]), z.number())) satisfies {
      type: "function";
      args: { type: "tuple"; items: [{ type: "string" }] };
      returns: { type: "number" };
    },
    {
      type: "function",
      args: { type: "tuple", items: [{ type: "string" }] },
      returns: { type: "number" },
    },
  ],

  [
    s(z.enum(["foo", "bar"])) satisfies {
      type: "enum";
      values: ["foo", "bar"];
    },
    { type: "enum", values: ["foo", "bar"] },
  ],

  [
    s(z.lazy(() => z.string().refine(() => true))) satisfies { type: "string" },
    { type: "string" },
  ],

  [
    s(
      z
        .number()
        .catch(23)
        .pipe(z.promise(z.literal(42)))
    ) satisfies {
      type: "promise";
      value: { type: "literal"; value: 42 };
    },
    { type: "promise", value: { type: "literal", value: 42 } },
  ],
] as const)("%#", (output, expected) => {
  expect(output).toEqual(expected);
});

test("discriminated union", () => {
  const discUnion = z
    .discriminatedUnion("name", [
      z.object({ name: z.literal("Gregor"), age: z.number().optional() }),
      z.object({ name: z.literal("Lea"), reach: z.number() }),
    ])
    .default({ name: "Lea", reach: 42 });
  const result = zerialize(discUnion);
  result satisfies {
    type: "discriminatedUnion";
    discriminator: "name";
    options: [
      {
        type: "object";
        properties: {
          name: { type: "literal"; value: "Gregor" };
          age: { type: "number"; isOptional: true };
        };
      },
      {
        type: "object";
        properties: {
          name: { type: "literal"; value: "Lea" };
          reach: { type: "number" };
        };
      }
    ];
  };
  type InfType = SzInfer<typeof result>;
  ({}) as InfType satisfies
    | { name: "Gregor"; age?: number }
    | { name: "Lea"; reach: number };

  ({ name: "Gregor" }) satisfies InfType;

  expect(result).toEqual({
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

  const shapeDefault = getDefaultValue(result);
  // shapeDefault satisfies InfType;
  expect(shapeDefault).toEqual({ name: "Lea", reach: 42 });
});
