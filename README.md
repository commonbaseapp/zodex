# Zodex

(De)?serialization library for [zod](https://zod.dev/). It both serializes and simplifies the shape of the schema, in the following ways:

- optional, nullable and default types are inlined into any given types itself

```json
{ "type": "string", "defaultValue": "hi" }
```

- checks are also inlined into the type itself, e.g.

```json
{ "type": "number", "min": 23, "max": 42 }
```

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

If you want to have the refined type for `shape` you can import the `Zerialize` type (this will be the default return of `zerialize` in a feature version, once the types are exhaustive):

```ts
import { Zerialize } from "zodex";

type Shape = Zerialize<typeof someZodType>;
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

which is exactly equal to its runtime value (shown in YAML for brevity, [you probably shouldn't use YAML](https://ruudvanasseldonk.com/2023/01/11/the-yaml-document-from-hell)):

```yaml
type: "discriminatedUnion"
discriminator: "id"
options:
  - type: "object"
    properties:
      id:
        type: "literal"
        value: "a"
      count:
        type: "number"
        isOptional: true
  - type: "object"
    properties:
      id:
        type: "literal"
        value: "b"
```

## Roadmap

- missing checks
  - **number:** gte, lte, positive, nonnegative, negative, nonpositive
  - **bigInt:** same as number
  - **date**: min, max
  - **set**: size
- return refined types for `zerialize` and `dezerialize`
- missing custom error messages

## Caveats

- lazy, effects and brand are omitted
- pipeline and catch types are unwrapped
- native enums are turned into enums
