# Brainjam standalone host build

Experimental Linux x64 CLI and host-service distribution based on upstream
Superset 1.29.0. Application protocol versions remain 1.29.0; the release tag and
build-info.json distinguish the fork revision. The official desktop stays unchanged.

Host identity uses a shared resolver: explicit SUPERSET_HOST_IDENTITY, then the
Boat runtime box ID, then the existing OS machine identity. Only Boat is currently
auto-detected. Other providers can supply a stable, scoped provisioning identity.
Encryption key derivation remains unchanged. This does not keep processes alive.

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
