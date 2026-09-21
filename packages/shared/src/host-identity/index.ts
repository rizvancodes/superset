import { createBoatIdentityProvider } from "./boat";
import type { HostIdentityProvider } from "./types";

export function resolveHostIdentity(
	machineIdentity: () => string,
	providers: HostIdentityProvider[] = [createBoatIdentityProvider()],
	configuredIdentity = process.env.SUPERSET_HOST_IDENTITY,
): string {
	if (configuredIdentity !== undefined) {
		if (!/^[a-zA-Z0-9][a-zA-Z0-9:._/-]{0,255}$/.test(configuredIdentity)) {
			throw new Error("SUPERSET_HOST_IDENTITY must be a nonempty scoped identity (maximum 256 characters)");
		}
		return configuredIdentity;
	}
	for (const provider of providers) {
		const identity = provider.resolve();
		if (identity !== null) return identity;
	}
	return machineIdentity();
}
