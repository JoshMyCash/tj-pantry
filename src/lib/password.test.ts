import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "./password";

const hash = hashPassword("Josh");
assert.notEqual(hash, "Josh");
assert.equal(verifyPassword("Josh", hash), true);
assert.equal(verifyPassword("josh", hash), false);
assert.equal(verifyPassword("Josh", "bad"), false);

console.log("password.test.ts: ok");
