import { z } from "zod";

type Modifiers =
  | z.ZodOptional<ZodTypes>
  | z.ZodNullable<ZodTypes>
  | z.ZodDefault<ZodTypes>
  | z.ZodReadonly<ZodTypes>;

type Primitives =
  | z.ZodString
  | z.ZodNumber
  | z.ZodNaN
  | z.ZodBigInt
  | z.ZodBoolean
  | z.ZodDate
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
  | z.ZodDiscriminatedUnion<any, z.ZodObject<{ [k: string]: ZodTypes }>[]>
  | z.ZodIntersection<ZodTypes, ZodTypes>
  | z.ZodNativeEnum<any>
  | z.ZodEnum<any>;

export type ZodTypes =
  | Modifiers
  | Primitives
  | ListCollections
  | KVCollections
  | ADTs
  | z.ZodFunction<any, ZodTypes>
  | z.ZodLazy<ZodTypes>
  | z.ZodLiteral<any>
  | z.ZodEffects<any, any>
  | z.ZodCatch<ZodTypes>
  | z.ZodPromise<ZodTypes>
  | z.ZodBranded<ZodTypes, any>
  | z.ZodPipeline<ZodTypes, ZodTypes>;

export type ZTypeName<T extends ZodTypes> = T["_def"]["typeName"];
