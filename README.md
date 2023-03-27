# Zodex

Type-safe (de)serialization library for [zod](https://zod.dev/). It both serializes and simplifies types, in the following ways:

- optional, nullable and default types are inlined into any given types itself (e.g. `{ type: "string", defaultValue: "hi" }`)
  - in zod these are wrapping types, which makes it harder to work with them
- number checks are also inlined into the type itself (e.g. `{ type: "number", min: 0, max: 10 }`)

**Caveat:** It does not support types like coerce, transform etc. as they are not serializable.

## Installation

```sh
pnpm add zodex
# or
yarn add zodex
# or
npm install zodex
```

## Usage

```ts
import { z } from "zod";
import { zerialize } from "zodex";

const someZodType = z.discriminatedUnion("id", [
  z.object({ id: z.literal("a"), count: z.number().optional() }),
  z.object({ id: z.literal("b") }),
]);
const shape = zerialize(someZodType);
```

Now `typeof shape` will be

```ts
type Shape = {
  type: "discriminatedUnion";
  discriminator: "id";
  options: [
    {
      type: "object";
      properties: {
        id: { type: "literal"; value: "a" };
        count: { type: "number"; isOptional: true };
      };
    },
    { type: "object"; properties: { id: { type: "literal"; value: "b" } } }
  ];
};
```

which is exactly equal to its runtime value:

```ts
({
  type: "discriminatedUnion",
  discriminator: "id",
  options: [
    {
      type: "object",
      properties: {
        id: {
          type: "literal",
          value: "a",
        },
        count: {
          type: "number",
          isOptional: true,
        },
      },
    },
    {
      type: "object",
      properties: {
        id: {
          type: "literal",
          value: "b",
        },
      },
    },
  ],
});
```

---

Expected breaking changes in the future:

1. Union options as tuples
1. Remove `sz.getDefaultValue` and `sz.Infer` in favor of deserializing to `zod` and using `z.defaultValue` and `z.Infer`
