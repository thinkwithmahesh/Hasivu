#!/usr/bin/env bash
# Remove non-production artifacts from Git tracking (for Raghavendra acceptance package).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DRY_RUN="${DRY_RUN:-0}"

log() { printf '%s\n' "$*"; }

git_rm_paths() {
  local label="$1"
  shift
  local paths=("$@")
  [[ ${#paths[@]} -gt 0 ]] || return 0
  log "$label: ${#paths[@]} path(s)"
  if [[ "$DRY_RUN" == "1" ]]; then
    printf '  [dry-run] %s\n' "${paths[@]:0:5}"
    [[ ${#paths[@]} -gt 5 ]] && log "  ... and $((${#paths[@]} - 5)) more"
    return
  fi
  printf '%s\0' "${paths[@]}" | xargs -0 git rm -rf --ignore-unmatch 2>/dev/null || true
}

collect_files() {
  local pattern="$1"
  git ls-files $pattern 2>/dev/null || true
}

BAK_FILES=$(collect_files '*.bak')
LOG_FILES=$(git ls-files | grep -E '\.(log|rdb)$|^dump\.rdb$' || true)
LEGACY_FILES=$(collect_files 'legacy/')

git_rm_paths "Backup (.bak)" $BAK_FILES
git_rm_paths "Logs / Redis dump" $LOG_FILES
git_rm_paths "Legacy serverless quarantine" $LEGACY_FILES

# Drop CI integration env from tree; use .env.example + README for test vars
if git ls-files --error-unmatch .env.integration &>/dev/null; then
  if [[ "$DRY_RUN" == "1" ]]; then
    log "[dry-run] remove .env.integration"
  else
    git rm -f .env.integration 2>/dev/null || true
  fi
fi

log "Done. Review with: git status"
