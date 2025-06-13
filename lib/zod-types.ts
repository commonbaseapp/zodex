import { z } from "zod/v4";

type Modifiers =
  | z.ZodOptional<ZodTypes>
  | z.ZodNullable<ZodTypes>
  | z.ZodDefault<ZodTypes>
  | z.ZodReadonly<ZodTypes>;

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
  | z.ZodSet<ZodTypes>
  | z.ZodArray<ZodTypes>;

type KVCollections =
  | z.ZodObject<any>
  | z.ZodRecord<any, ZodTypes>
  | z.ZodMap<ZodTypes, ZodTypes>;

type ADTs =
  | z.ZodUnion<readonly [ZodTypes, ...ZodTypes[]]>
  | z.ZodDiscriminatedUnion<z.ZodObject<{ [k: string]: ZodTypes }>[]>
  | z.ZodIntersection<ZodTypes, ZodTypes>
  | z.ZodEnum<any>;

export type ZodTypes =
  | Modifiers
  | Primitives
  | ListCollections
  | KVCollections
  | ADTs
  | z.ZodLazy<ZodTypes>
  | z.ZodLiteral<any>
  | z.ZodCatch<ZodTypes>
  | z.ZodPromise<ZodTypes>
  | z.ZodPipe<ZodTypes, ZodTypes>
  | z.ZodTransform<unknown, unknown>
  | z.ZodFile;

export type ZTypeName<T extends ZodTypes> = T["def"]["type"];
