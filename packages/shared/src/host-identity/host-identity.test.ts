import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveHostIdentity as resolve } from ".";
import { createBoatIdentityProvider } from "./boat";

const boat = (id: string) =>
	createBoatIdentityProvider("linux", () => `export BOAT_ID="${id}"\n`);
const missing = () => {
	throw Object.assign(new Error("missing"), { code: "ENOENT" });
};

let directory: string;
let identityPath: string;
beforeEach(() => {
	directory = mkdtempSync(join(tmpdir(), "superset-identity-"));
	identityPath = join(directory, "host-identity");
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));
const resolveHostIdentity = (...args: Parameters<typeof resolve>) =>
	resolve(args[0], args[1], args[2], args[3] ?? identityPath);

describe("persistent host identity", () => {
	test("same box survives a replaced Linux machine; a clone gets another identity", () => {
		const first = resolveHostIdentity(
			() => "machine-a",
			[boat("bx_one")],
			undefined,
		);
		expect(
			resolveHostIdentity(() => "machine-b", [boat("bx_one")], undefined),
		).toBe(first);
		expect(
			resolveHostIdentity(
				() => "machine-b",
				[boat("bx_two")],
				undefined,
				join(directory, "clone-identity"),
			),
		).not.toBe(first);
	});
	test("preserves the existing identity outside Boat", () => {
		expect(
			resolveHostIdentity(
				() => "existing",
				[createBoatIdentityProvider("linux", missing)],
				undefined,
			),
		).toBe("existing");
		expect(
			createBoatIdentityProvider("darwin", () => {
				throw new Error("must not read");
			}).resolve(),
		).toBeNull();
	});
	test("recognized but broken provider fails instead of changing identity", () => {
		expect(() =>
			resolveHostIdentity(() => "fallback", [boat("invalid")], undefined),
		).toThrow();
		expect(() =>
			createBoatIdentityProvider("linux", () => {
				throw Object.assign(new Error("denied"), { code: "EACCES" });
			}).resolve(),
		).toThrow("denied");
	});
	test("explicit provisioning identity takes precedence without consulting providers", () => {
		expect(
			resolveHostIdentity(
				() => "machine",
				[
					{
						resolve() {
							throw new Error("must not detect");
						},
					},
				],
				"custom:account:instance",
			),
		).toBe("custom:account:instance");
	});
	test("invalid explicit identity fails rather than falling back", () => {
		for (const identity of ["", " spaced ", "line\nbreak", "x".repeat(257)]) {
			expect(() =>
				resolveHostIdentity(() => "fallback", [], identity),
			).toThrow();
		}
	});
});

test("saved identity survives missing metadata across resolver launches", () => {
	expect(resolveHostIdentity(() => "old-machine", [boat("bx_one")])).toBe(
		"boat:bx_one",
	);
	const broken = createBoatIdentityProvider(
		"linux",
		() => "export PRODUCT_MODE=agent\n",
	);
	expect(resolveHostIdentity(() => "new-machine", [broken])).toBe(
		"boat:bx_one",
	);
	expect(
		resolveHostIdentity(
			() => "new-machine",
			[createBoatIdentityProvider("linux", missing)],
		),
	).toBe("boat:bx_one");
	expect(statSync(identityPath).mode & 0o777).toBe(0o600);
});

test("explicit identity seeds an existing host when metadata is missing", () => {
	resolveHostIdentity(() => "machine", [], "boat:bx_one");
	expect(resolveHostIdentity(() => "other-machine", [])).toBe("boat:bx_one");
	expect(() => resolveHostIdentity(() => "machine", [], "boat:bx_two")).toThrow(
		"conflicts",
	);
});

test("cloned state requires an explicit identity reset", () => {
	resolveHostIdentity(() => "machine", [boat("bx_one")]);
	expect(resolveHostIdentity(() => "machine", [boat("bx_two")])).toBe(
		"boat:bx_one",
	);
	rmSync(identityPath);
	expect(resolveHostIdentity(() => "machine", [boat("bx_two")])).toBe(
		"boat:bx_two",
	);
});

test("invalid saved state never silently switches the host", () => {
	writeFileSync(identityPath, "");
	expect(() =>
		resolveHostIdentity(() => "fallback", [boat("bx_one")]),
	).toThrow();
});
