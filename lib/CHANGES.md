# Version ? (Zod v4)

Breaking changes:

- fix: for literals, `value` is removed in favor of `values`, to reflect Zod's new support for arrays.
- fix: require `version` for `cidr` string
- fix: drop `finite` (numbers no longer allow infinite values in Zod) and `int` (uses `format` instead)
- fix: drop `effects`, `preprocesses`, and `superRefinements` in favor of `checks` property and `transform` and `pipe` types; `transforms` expects new Zod 4 function format
- fix: remove object's `unknownKeys`
- fix: remove function type
- fix: remove nativeEnum type
- fix: represent `enum` type as object instead of array, with number as well as string keys and values
- fix: disallow other properties with JSON references (per spec)

Other changes:

- feat: for number and bigInt types, add `format`
- feat: adds serialization for template literals (with `parts`)
- feat: add serialization for `File` (with `min`, `max`, and `mime`)
- feat: serializes custom errors
- feat: add email `pattern` and `flags` properties
- feat: add string types: jwt (with `alg` property), e164, xid, guid, ksuid
- feat: add `version` property for `uuid`
- feat: add to literals: bigInt, boolean, null, and undefined types
- feat: bump `type-fest` and `zod` dependencies
- fix: allow any type as Map key
