import { useMemo, useState } from "react";
import z from "zod";
import { dezerialize, SzType, zerialize } from "zodex";

const DEFAULT_ZOD_VALUE = `z.object({
  n: z.number().min(42),
  d: z.date().nullable()
})`;
const DEFAULT_OBJ_VALUE = `{
  "n": 32,
  "d": null
}`;

export function App() {
  const [zodValue, setZodValue] = useState(DEFAULT_ZOD_VALUE);
  const [objValue, setObjValue] = useState(DEFAULT_OBJ_VALUE);

  const zodexValue = useMemo<SzType | null>(() => {
    try {
      return zerialize(new Function("z", `return ${zodValue}`)(z));
    } catch (error) {
      return null;
    }
  }, [zodValue]);

  const dezodSchema = useMemo(
    () => zodexValue && dezerialize(zodexValue),
    [zodexValue],
  );
  const result = useMemo(() => {
    try {
      return dezodSchema?.safeParse(JSON.parse(objValue));
    } catch (error) {
      return null;
    }
  }, [dezodSchema, objValue]);

  console.log(result);

  return (
    <div className="app">
      <p>
        <a href="https://github.com/commonbaseapp/zodex" target="_blank">
          zodex
        </a>{" "}
        is a type-safe (de)serialization library for zod. It both serializes and
        simplifies types into JSON, as you can see in the example below.
        <br />
        <br />
        You can edit the zod schema below to see how the corresponding
        serialized zodex schema looks like.
      </p>
      <div className="playground">
        <label>zod schema</label>
        <textarea
          cols={120}
          rows={10}
          value={zodValue}
          onChange={(event) => setZodValue(event.target.value)}
        />
        {zodexValue && (
          <pre>
            <code>{JSON.stringify(zodexValue, null, 2)}</code>
          </pre>
        )}

        <p>
          You can enter a JSON value below and see how the deserialized schema
          parses it, like the original zod schema would have:
        </p>

        <label>value to validate</label>
        <textarea
          cols={120}
          rows={10}
          value={objValue}
          onChange={(event) => setObjValue(event.target.value)}
        />
        {result && (
          <pre>
            <code>{JSON.stringify(result, null, 2)}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
