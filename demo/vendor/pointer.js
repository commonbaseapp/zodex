const TILDE_0_RE = /~0/g;
const TILDE_1_RE = /~1/g;
function unescape(frag) {
  return frag.replace(TILDE_1_RE, "/").replace(TILDE_0_RE, "~");
}

const __meta = Symbol();
const LII_RE = /^[a-zA-Z][a-zA-Z0-9\.\-_:]*$/; // Location-independent identifier, JSON Schema draft 7, par. 8.2.3
function normalizeUri(input, scope) {
  const uri = new URL(input, scope);
  const out = uri.toString();
  return out + (!uri.hash && out[out.length - 1] !== "#" ? "#" : "");
}
function isAnnotated(obj) {
  return (
    obj !== null && typeof obj === "object" && typeof obj[__meta] === "object"
  );
}
function getMeta(obj) {
  if (!isAnnotated(obj)) {
    throw new Error("Not annotated");
  }
  return obj[__meta];
}
function getKey(obj) {
  const parent = getMeta(obj).parent;
  if (typeof parent === "undefined") {
    return undefined;
  } else if (Array.isArray(parent)) {
    for (let i = 0; i < parent.length; i++) {
      if (parent[i] === obj) {
        return i;
      }
    }
    return undefined;
  } else {
    return Object.keys(parent).find((k) => parent[k] === obj);
  }
}
function getById(obj, id) {
  if (obj === null || typeof obj !== "object") {
    throw new TypeError("Invalid object");
  }
  const meta = getMeta(obj);
  return meta.registry[normalizeUri(id, meta.scope)];
}

const PREFIX_RE = /^(0|[1-9][0-9]*?)([#]?)$/;
const INDEX_RE = /-|0|[1-9][0-9]*/;
function getPointer(obj) {
  const p = [];
  let parent,
    current = obj;
  while ((parent = getMeta(current).parent)) {
    const frag = getKey(current);
    if (!frag) {
      throw new Error(`Failed to get key for ${JSON.stringify(current)}`);
    } else {
      p.push("" + frag);
      current = parent;
    }
  }
  return [""].concat(p.reverse()).join("/");
}
function resolve(obj, path) {
  if (typeof obj === "undefined") {
    throw new TypeError("Bad object");
  } else if (typeof path !== "string") {
    throw new TypeError("Bad path");
  } else if (!path) {
    return obj;
  }
  let current = obj;
  const parts = path.split("/");
  const prefix = parts.shift();
  if (prefix) {
    if (prefix.match(LII_RE)) {
      current = getById(current, `#${prefix}`);
    } else {
      const match = prefix.match(PREFIX_RE);
      if (!match) {
        throw new SyntaxError(`Bad prefix ${prefix}`);
      } else {
        let levels = parseInt(match[1]);
        while (levels--) {
          current = getMeta(current).parent;
          if (!current) {
            throw new RangeError(`Invalid prefix "${match[1]}"`);
          }
        }
        if (match[2]) {
          return getKey(current);
        }
      }
    }
  }
  while (parts.length) {
    if (current === null || typeof current !== "object") {
      throw new TypeError(`Invalid type at path`);
    }
    const part = unescape(parts.shift());
    if (Array.isArray(current)) {
      if (!part.match(INDEX_RE)) {
        throw new SyntaxError(`Invalid array index "${part}"`);
      } else if (part === "-") {
        throw new RangeError(`Index out of bounds "${part}"`);
      } else {
        const index = parseInt(part);
        if (index > current.length) {
          throw new RangeError(`Index out of bounds "${part}"`);
        } else {
          current = current[index];
        }
      }
    } else {
      current = current[part];
      if (typeof current === "undefined") {
        throw new RangeError(`Cannot find property "${part}"`);
      }
    }
  }
  return current;
}

export { getPointer, resolve };
