import { ValueOf } from "type-fest";

import {
  SzType,
  SzDefaultOrNullable,
  SzLiteral,
  SzArray,
  SzObject,
  SzOptional,
  SzDefault,
  SzNullable,
} from "./types";

type SzDefaultableType =
  | (SzType & SzDefaultOrNullable)
  | SzLiteral<any>
  | SzArray<any>
  | SzObject<{
      [key: string]: SzDefaultableType | (SzType & SzOptional);
    }>;

type NonOptionalKeysOf<T extends Record<any, SzType>> = Exclude<
  {
    [Key in keyof T]: T extends Record<Key, T[Key]>
      ? T[Key] extends SzOptional
        ? never
        : Key
      : never;
  }[keyof T],
  undefined
>;
type SzDefaultValue<T extends SzType> = T extends SzDefault<infer Value>
  ? Value
  : T extends SzNullable
  ? null
  : T extends { type: "literal" }
  ? T["value"]
  : T extends SzArray<infer _T>
  ? []
  : T extends SzObject<infer Properties>
  ? ValueOf<Properties> extends SzDefaultOrNullable | SzOptional
    ? {
        [Key in NonOptionalKeysOf<Properties>]: SzDefaultValue<Properties[Key]>;
      }
    : never
  : never;

export function getDefaultValue<T extends SzDefaultableType>(
  shape: T
): SzDefaultValue<T>;
export function getDefaultValue<T extends SzDefaultableType>(
  shape: T
): unknown {
  if ("defaultValue" in shape) {
    return shape.defaultValue;
  }
  if ("isNullable" in shape && shape.isNullable) {
    return null;
  }

  switch (shape.type) {
    case "literal":
      return shape.value;

    case "array":
      return [];

    case "object":
      return Object.fromEntries(
        (Object.entries(shape.properties) as [any, any][])
          .filter(
            ([, value]) =>
              !value.isOptional && getDefaultValue(value) !== undefined
          )
          .map(([key, value]) => [key, getDefaultValue(value)])
      );
  }
}
