# Zodex

Type-safe (de)?serialization library for [zod](https://zod.dev/). It both serializes and simplifies types, in the following ways:

- optional, nullable and default types are inlined into any given types itself

```json
{ "type": "string", "defaultValue": "hi" }
```

- number checks are also inlined into the type itself

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

- deserialization (WIP lives on branch [dezerial](https://github.com/commonbaseapp/zodex/tree/dezerial), could use some help from TypeScript heroes)
- missing checks
  - **number:** gte, lte, positive, nonnegative, negative, nonpositive
  - **bigInt:** same as number
- custom error messages are not included

## Caveats

- lazy, effects and brand are omitted
- pipeline and catch types are unwrapped
- native enums are turned into enums
