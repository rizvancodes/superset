import { randomUUID } from "node:crypto";
import {
	linkSync,
	mkdirSync,
	readFileSync,
	unlinkSync,
	writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export function validateIdentity(identity: string): void {
	if (!/^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,255}$/.test(identity)) {
		throw new Error(
			"Host identity must be a nonempty scoped identity (maximum 256 characters)",
		);
	}
}

export function readIdentity(path: string): string | null {
	let identity: string;
	try {
		identity = readFileSync(path, "utf8").trimEnd();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
		throw error;
	}
	validateIdentity(identity);
	return identity;
}

export function saveIdentity(path: string, identity: string): string {
	validateIdentity(identity);
	const existing = readIdentity(path);
	if (existing !== null) {
		if (existing !== identity) {
			throw new Error(
				`Host identity conflicts with ${path}. To register a clone as a new host, stop Superset and remove that file before provisioning its new identity.`,
			);
		}
		return existing;
	}
	mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
	const temporary = `${path}.${randomUUID()}.tmp`;
	writeFileSync(temporary, `${identity}\n`, { mode: 0o600, flag: "wx" });
	try {
		// Publish a complete file without replacing another process's identity.
		linkSync(temporary, path);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
	} finally {
		unlinkSync(temporary);
	}
	const saved = readIdentity(path);
	if (saved !== identity)
		throw new Error(`Host identity conflicts with ${path}`);
	return saved;
}
