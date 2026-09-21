import { describe, expect, test } from "bun:test";
import { createBoatIdentityProvider } from "./boat";
import { resolveHostIdentity } from ".";

const boat = (id: string) => createBoatIdentityProvider("linux", () => `export BOAT_ID="${id}"\n`);
const missing = () => { throw Object.assign(new Error("missing"), { code: "ENOENT" }); };

describe("persistent host identity", () => {
	test("same box survives a replaced Linux machine; a clone gets another identity", () => {
		const first = resolveHostIdentity(() => "machine-a", [boat("bx_one")], undefined);
		expect(resolveHostIdentity(() => "machine-b", [boat("bx_one")], undefined)).toBe(first);
		expect(resolveHostIdentity(() => "machine-b", [boat("bx_two")], undefined)).not.toBe(first);
	});
	test("preserves the existing identity outside Boat", () => {
		expect(resolveHostIdentity(() => "existing", [createBoatIdentityProvider("linux", missing)], undefined)).toBe("existing");
		expect(createBoatIdentityProvider("darwin", () => { throw new Error("must not read"); }).resolve()).toBeNull();
	});
	test("recognized but broken provider fails instead of changing identity", () => {
		expect(() => resolveHostIdentity(() => "fallback", [boat("invalid")], undefined)).toThrow();
		expect(() => createBoatIdentityProvider("linux", () => { throw Object.assign(new Error("denied"), { code: "EACCES" }); }).resolve()).toThrow("denied");
	});
	test("explicit provisioning identity takes precedence without consulting providers", () => {
		expect(resolveHostIdentity(() => "machine", [{ resolve() { throw new Error("must not detect"); } }], "custom:account:instance")).toBe("custom:account:instance");
	});
	test("invalid explicit identity fails rather than falling back", () => {
		for (const identity of ["", " spaced ", "line\nbreak", "x".repeat(257)]) {
			expect(() => resolveHostIdentity(() => "fallback", [], identity)).toThrow();
		}
	});
});
