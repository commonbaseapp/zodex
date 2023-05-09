import React from "react";
import { Dezerialize, SzType } from "zodex";
import { z } from "zod";

type ShapeValueProps<Value> = {
  value: Value;
  onChange: (_value: Value) => void;
};

type SzInfer<T extends SzType> = z.infer<Dezerialize<T>>;

type ShapeProps<T extends SzType> = {
  shape: T;
} & ShapeValueProps<SzInfer<T>>;

type MappedShapeControl<T extends SzType> = {
  [Type in T["type"]]: React.FC<ShapeProps<Extract<T, { type: Type }>>>;
};

export function mapTypesToComponents<T extends SzType>(
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
