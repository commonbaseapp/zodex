import React from "react";

import { SzInfer } from "./infer";
import { SzType } from "./types";

type ShapeValueProps<Value> = {
  value: Value;
  onChange: (_value: Value) => void;
};

type ShapeProps<T extends SzType> = {
  shape: T;
} & ShapeValueProps<SzInfer<T>>;

type MappedShapeControl<T extends SzType> = {
  [Type in T["type"]]: React.FC<ShapeProps<Extract<T, { type: Type }>>>;
};

export function mapTypesToViews<T extends SzType>(
  controls: MappedShapeControl<T>
) {
  return function ShapeControl<I = SzInfer<T>>({
    shape,
    value,
    onChange,
  }: {
    shape: T;
    value: I;
    onChange: (_value: I) => void;
  }) {
    return React.createElement(controls[shape.type as keyof typeof controls], {
      shape,
      value,
      onChange,
    } as any);
  };
}
