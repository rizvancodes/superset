import { readFileSync } from "node:fs";
import { platform } from "node:os";
import type { HostIdentityProvider } from "./types";

export function createBoatIdentityProvider(
	os = platform(),
	readRuntime: () => string = () =>
		readFileSync("/run/ascii-secrets/env.sh", "utf8"),
): HostIdentityProvider {
	return {
		resolve() {
			if (os !== "linux") return null;
			let contents: string;
			try {
				contents = readRuntime();
			} catch (error) {
				if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
				throw error;
			}
			const id = contents.match(/^export BOAT_ID="(bx_[a-zA-Z0-9]+)"$/m)?.[1];
			if (!id) throw new Error("Boat runtime is missing a valid BOAT_ID");
			return `boat:${id}`;
		},
	};
}
