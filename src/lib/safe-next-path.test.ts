import assert from "node:assert/strict";
import { safeNextPath } from "./safe-next-path";

assert.equal(safeNextPath("/products"), "/products");
assert.equal(safeNextPath("/lists?x=1"), "/lists?x=1");
assert.equal(safeNextPath("//evil.com"), "/");
assert.equal(safeNextPath("https://evil.com"), "/");
assert.equal(safeNextPath("\\evil"), "/");
assert.equal(safeNextPath(undefined, "/home"), "/home");

console.log("safe-next-path.test.ts: ok");
