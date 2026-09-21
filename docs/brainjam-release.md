# Brainjam standalone host build

Experimental Linux x64 CLI and host-service distribution based on upstream
Superset 1.29.0. Application protocol versions remain 1.29.0; the release tag and
build-info.json distinguish the fork revision. The official desktop stays unchanged.

Host identity is saved in `$SUPERSET_HOME_DIR/host-identity` (default
`~/.superset/host-identity`). The CLI and host service share this resolver. On first
use, `SUPERSET_HOST_IDENTITY` or Boat runtime metadata supplies the identity;
subsequent launches read the saved value without requiring runtime metadata.
Ordinary machines without a managed identity retain their existing OS identity.
An explicit identity must match any saved value, otherwise startup fails.
Encryption key derivation remains unchanged. This does not keep processes alive.

To migrate a host whose Boat metadata is already missing, run the new CLI once
with its verified existing identity, for example:
`SUPERSET_HOST_IDENTITY=boat:bx_EXAMPLE superset status`.
Do not invent a new value for an existing host.

A stop/resume keeps the saved file. When provisioning a cloned VM as a NEW host,
stop Superset before removing the clone's `~/.superset/host-identity`, then launch
with the clone's new provider identity. Do not bake this file into a base image.
The saved value deliberately wins over runtime discovery; clones must be reset
explicitly. Never reset the original VM during a normal restart.

Builds use the upstream distribution builder and smoke/headless checks. The pinned
CLI refuses self-update, including requests from the desktop host updater, so an
upstream build cannot silently replace this patch. Update or roll back through
the pinned dotfiles installer instead. Original upstream license terms apply.

Source branch: fix/persistent-host-identity. No upstream PR has been submitted.

To release a subsequent tested revision, tag its commit with
brainjam-cli-v1.29.0-N (increment N) and push that tag. GitHub Actions builds and
publishes the matching archive, checksums and source commit metadata. Do not move
published tags or replace their assets. Update the dotfiles release and SHA256
pin only after verifying the new release. Keep fork packaging commits separate
from the identity change when preparing an upstream PR.

Optional standalone agent recovery: set `SUPERSET_RESUME_AGENTS_ON_START=1` in the
service launcher. On startup, missing terminals for previously open agents resume
with their saved conversation IDs; surviving terminals are adopted unchanged.
Explicitly closed sessions and old ended history stay closed. It does not preserve
running tasks mid-tool-call or restore plain shell processes. Desktop and mobile
clients can discover the restored live terminals without a client build change.
Mobile display still needs verification against the installed beta.
