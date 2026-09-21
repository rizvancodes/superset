import { homedir } from "node:os";
import { join } from "node:path";
import { createBoatIdentityProvider } from "./boat";
import { readIdentity, saveIdentity, validateIdentity } from "./store";
import type { HostIdentityProvider } from "./types";

export function resolveHostIdentity(
	machineIdentity: () => string,
	providers: HostIdentityProvider[] = [createBoatIdentityProvider()],
	configuredIdentity = process.env.SUPERSET_HOST_IDENTITY,
	identityPath = join(
		process.env.SUPERSET_HOME_DIR ?? join(homedir(), ".superset"),
		"host-identity",
	),
): string {
	if (configuredIdentity !== undefined) {
		validateIdentity(configuredIdentity);
		return saveIdentity(identityPath, configuredIdentity);
	}
	const saved = readIdentity(identityPath);
	if (saved !== null) return saved;
	for (const provider of providers) {
		const identity = provider.resolve();
		if (identity !== null) return saveIdentity(identityPath, identity);
	}
	return machineIdentity();
}
