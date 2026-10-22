import assert from "node:assert/strict";
import test from "node:test";
import { matchesTestingAdminEmail } from "./testing-admin";

test("testing admin requires an exact, verified configured email", () => {
  assert.equal(matchesTestingAdminEmail("Admin@example.com", true, "admin@example.com"), true);
  assert.equal(matchesTestingAdminEmail("admin@example.com", false, "admin@example.com"), false);
  assert.equal(matchesTestingAdminEmail("other@example.com", true, "admin@example.com"), false);
  assert.equal(matchesTestingAdminEmail("admin@example.com", true, undefined), false);
  assert.equal(matchesTestingAdminEmail(undefined, true, "admin@example.com"), false);
});
