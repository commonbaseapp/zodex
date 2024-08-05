# Zodex

Type-safe (de)serialization library for [zod](https://zod.dev/). It both serializes and simplifies types into a JSON format, in the following ways:

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

## Options

Both `zerialize` and `dezerialize` accept an options object with the
same properties.

Since Zod does not allow the specification of the names of effects
(refinements, transforms, and preprocesses), we allow you to supply
as options maps of names to effects so that these can be part of
serialization and deserialization. If none of these options are
supplied, the effects will be omitted.

Properties:

- `superRefinements` - Map of name to `.superRefine()` functions
- `transforms` - Map of name to `.transform()` functions
- `preprocesses` - Map of name to `z.preprocess()` functions

## Use of JSON References

JSON references are used to represent local references. If you wish to use
JSON references for remote (non-cyclic) references, you may do so, but you
will need to use a library like
[`json-refs`](https://github.com/whitlockjc/json-refs) (with `resolveRefs`)
to first resolve such references and then supply the object to `dezerialize`.

Zodex will serialize local references, including handling recursive ones. As
with JSON Schema, the `$defs` property may be a reasonable top-level property
to use as storage for local references, but it receives no special treatment
by this library (any property could be targeted by one's references).

Note that if you wish to use additional properties with an item containing a
reference, e.g., `isOptional`, you will first need to wrap the JSON reference
within a single-item union such as in the following:

```json
{
  "type": "union",
  "options": [
    {
      "$ref": "#/properties/id"
    }
  ]
}
```

Note that due to technical limitations with Zod, we are unable to allow a
JSON reference in place of an object `properties` object. You can either
resolve this first with another library (if it is a non-cyclic reference),
or target the whole object or individual properties.

## Roadmap

- custom error messages are not included

## Caveats

- `brand` is not supportable and omitted
- `lazy` and `pipeline` types are unwrapped
- `catch` with a function can have its then-value serialized but it
  cannot then be deserialized back into using the original function
- Due to technical limitations, we cannot support the regular
  `refine()`, `custom()` and `instanceof` methods (and they will be
  ignored), but these are really just implementations of `superRefine()`
  which is supported
