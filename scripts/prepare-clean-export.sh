#!/usr/bin/env bash
# Prepare HASIVU for a clean Git export (production-relevant files only).
# Uses jcodemunch/GitNexus repo layout: src/, web/, tests/, scripts/, prisma/, docs/, .github/
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DRY_RUN="${DRY_RUN:-0}"
EXPORT_DIR="${EXPORT_DIR:-}"

log() { printf '%s\n' "$*"; }
run() {
  if [[ "$DRY_RUN" == "1" ]]; then
    log "[dry-run] $*"
  else
    "$@"
  fi
}

# --- Root markdown allowlist (project docs only) ---
ROOT_MD_KEEP=(README.md AGENTS.md)

remove_root_status_markdown() {
  local removed=0
  for f in "$ROOT"/*.md; do
    [[ -f "$f" ]] || continue
    base="$(basename "$f")"
    for keep in "${ROOT_MD_KEEP[@]}"; do
      [[ "$base" == "$keep" ]] && continue 2
    done
    if [[ "$DRY_RUN" == "1" ]]; then
      log "[dry-run] remove root markdown: $base"
    elif git rev-parse --is-inside-work-tree &>/dev/null && git ls-files --error-unmatch "$base" &>/dev/null; then
      git rm -f "$base" 2>/dev/null || rm -f "$base"
    else
      rm -f "$base"
    fi
    removed=$((removed + 1))
  done
  log "Root status markdown removed: $removed"
}

remove_large_artifacts() {
  for artifact in AWSCLIV2.pkg; do
    [[ -f "$ROOT/$artifact" ]] || continue
    if [[ "$DRY_RUN" == "1" ]]; then
      log "[dry-run] remove $artifact"
    elif git ls-files --error-unmatch "$artifact" &>/dev/null 2>&1; then
      git rm -f "$artifact"
    else
      rm -f "$ROOT/$artifact"
    fi
  done
}

# Directories never needed in a clean public export
PRUNE_DIRS=(
  graphify-out
  .gitnexus
  .claude-code
  .gemini-scratch
  .serverless
  node_modules
  web/node_modules
  dist
  web/.next
  coverage
  web/coverage
  test-results
  web/test-results
  playwright-report
  web/playwright-report
)

prune_local_artifacts() {
  for d in "${PRUNE_DIRS[@]}"; do
    [[ -e "$ROOT/$d" ]] || continue
    if [[ "$DRY_RUN" == "1" ]]; then
      log "[dry-run] rm -rf $d"
    else
      rm -rf "$ROOT/$d"
    fi
  done
}

# rsync-based clean copy for a fresh git repo (sibling directory by default)
create_export_tree() {
  local dest="${EXPORT_DIR:-$ROOT/../hasivu-platform-export}"
  log "Export tree -> $dest"
  if [[ "$DRY_RUN" == "1" ]]; then
    log "[dry-run] mkdir and rsync (see docs/REPO_CLEAN_EXPORT.md)"
    return
  fi
  mkdir -p "$dest"
  rsync -a --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'web/node_modules' \
    --exclude 'dist' \
    --exclude 'web/.next' \
    --exclude 'coverage' \
    --exclude 'web/coverage' \
    --exclude 'test-results' \
    --exclude 'web/test-results' \
    --exclude 'playwright-report' \
    --exclude 'web/playwright-report' \
    --exclude 'graphify-out' \
    --exclude '.gitnexus' \
    --exclude '.env' \
    --exclude '.env.local' \
    --exclude '.env.*' \
    --include '.env.example' \
    --include '.env.integration' \
    --include '.env.production.example' \
    --exclude 'AWSCLIV2.pkg' \
    --exclude 'legacy/' \
    "$ROOT/" "$dest/"
  log "Done. Next: cd $dest && cp .env.example .env.local && git init"
}

log "=== HASIVU clean export prep ==="
remove_large_artifacts
remove_root_status_markdown
prune_local_artifacts

if [[ "${CREATE_EXPORT:-0}" == "1" ]]; then
  create_export_tree
fi

log "=== Complete ==="
log "See docs/REPO_CLEAN_EXPORT.md for fresh GitHub upload steps."
