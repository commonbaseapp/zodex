import { z } from "zod";

// Helper type to extract SomeType from Zod 4
type SomeType = z.core.SomeType;

type Modifiers =
  | z.ZodOptional<SomeType>
  | z.ZodNullable<SomeType>
  | z.ZodDefault<SomeType>
  | z.ZodCatch<SomeType>
  | z.ZodPipe<SomeType, SomeType>
  | z.ZodTransform<SomeType, SomeType>
  | z.ZodLazy<SomeType>
  | z.ZodReadonly<SomeType>;

type Primitives =
  | z.ZodString
  | z.ZodCoercedString
  | z.ZodNumber
  | z.ZodCoercedNumber
  | z.ZodNaN
  | z.ZodBigInt
  | z.ZodCoercedBigInt
  | z.ZodBoolean
  | z.ZodCoercedBoolean
  | z.ZodDate
  | z.ZodCoercedDate
  | z.ZodUndefined
  | z.ZodNull
  | z.ZodAny
  | z.ZodUnknown
  | z.ZodNever
  | z.ZodVoid
  | z.ZodSymbol;

type ListCollections =
  | z.ZodTuple<any, any>
  | z.ZodSet<SomeType>
  | z.ZodArray<SomeType>;

type KVCollections =
  | z.ZodObject<any>
  | z.ZodRecord<any, SomeType>
  | z.ZodMap<SomeType, SomeType>;

type ADTs =
  | z.ZodUnion<readonly [SomeType, ...SomeType[]]>
  | z.ZodDiscriminatedUnion<readonly SomeType[]>
  | z.ZodIntersection<SomeType, SomeType>
  | z.ZodEnum<any>;

export type ZodTypes =
  | Modifiers
  | Primitives
  | ListCollections
  | KVCollections
  | ADTs
  | z.ZodLazy<SomeType>
  | z.ZodLiteral<any>
  | z.ZodTemplateLiteral<any>
  | z.ZodCatch<SomeType>
  | z.ZodPromise<SomeType>
  | z.ZodPipe<SomeType, SomeType>
  | z.ZodTransform<unknown, unknown>
  | z.ZodFile;

export type ZTypeName<T extends ZodTypes> = T["_zod"]["def"]["type"];
