#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MANIFEST_FILE="${WORKSPACE_ROOT}/workspace.yaml"
SETTINGS_SOURCE="${WORKSPACE_ROOT}/.claude/settings.json"
WORKSPACE_REVISION="unknown"
DRY_RUN=false

for arg in "$@"; do
  case "${arg}" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      echo "Usage: $0 [--dry-run]"
      echo "Sync .claude/settings.json from the parent workspace into configured child repositories."
      echo "Machine-local .claude/settings.local.json is intentionally never synced."
      exit 0
      ;;
    *)
      echo "Error: unknown argument ${arg}" >&2
      echo "Usage: $0 [--dry-run]" >&2
      exit 1
      ;;
  esac
done

if command -v git >/dev/null 2>&1 && git -C "${WORKSPACE_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  WORKSPACE_REVISION="$(git -C "${WORKSPACE_ROOT}" rev-parse --short HEAD 2>/dev/null || printf 'uncommitted')"
fi

if [[ ! -f "${MANIFEST_FILE}" ]]; then
  echo "Error: manifest not found at ${MANIFEST_FILE}" >&2
  exit 1
fi

if [[ ! -f "${SETTINGS_SOURCE}" ]]; then
  echo "Error: source settings not found at ${SETTINGS_SOURCE}" >&2
  exit 1
fi

strip_quotes() {
  local value="$1"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

REPO_NAMES=()
REPO_PATHS=()
CURRENT_NAME=""
CURRENT_PATH=""

flush_current() {
  if [[ -z "${CURRENT_NAME}" ]]; then
    return
  fi

  local resolved_path="${CURRENT_PATH}"
  if [[ -z "${resolved_path}" ]]; then
    resolved_path="./${CURRENT_NAME}"
  fi

  REPO_NAMES+=("${CURRENT_NAME}")
  REPO_PATHS+=("${resolved_path}")

  CURRENT_NAME=""
  CURRENT_PATH=""
}

while IFS= read -r raw_line || [[ -n "${raw_line}" ]]; do
  line="${raw_line%%#*}"

  if [[ "${line}" =~ ^[[:space:]]*-[[:space:]]*name:[[:space:]]*(.+)[[:space:]]*$ ]]; then
    flush_current
    CURRENT_NAME="$(strip_quotes "${BASH_REMATCH[1]}")"
    continue
  fi

  if [[ "${line}" =~ ^[[:space:]]*path:[[:space:]]*(.+)[[:space:]]*$ ]]; then
    CURRENT_PATH="$(strip_quotes "${BASH_REMATCH[1]}")"
    continue
  fi
done < "${MANIFEST_FILE}"

flush_current

if [[ ${#REPO_NAMES[@]} -eq 0 ]]; then
  echo "Error: no repositories parsed from ${MANIFEST_FILE}" >&2
  exit 1
fi

echo "Sync source: ${SETTINGS_SOURCE}"
if [[ "${DRY_RUN}" == true ]]; then
  echo "Dry run: no files will be written"
fi

for i in "${!REPO_NAMES[@]}"; do
  repo_name="${REPO_NAMES[$i]}"
  repo_path="${REPO_PATHS[$i]}"

  if [[ "${repo_path}" = /* ]]; then
    target_repo="${repo_path}"
  else
    target_repo="${WORKSPACE_ROOT}/${repo_path#./}"
  fi

  if [[ ! -d "${target_repo}" ]]; then
    echo "Skip ${repo_name}: missing directory ${target_repo}" >&2
    continue
  fi

  if [[ ! -d "${target_repo}/.git" ]]; then
    echo "Skip ${repo_name}: ${target_repo} is not a Git repository" >&2
    continue
  fi

  target_settings="${target_repo}/.claude/settings.json"

  if [[ "${DRY_RUN}" == true ]]; then
    echo "Would sync .claude/settings.json -> ${repo_name} (${target_settings})"
    continue
  fi

  mkdir -p "${target_repo}/.claude"
  cp "${SETTINGS_SOURCE}" "${target_settings}"

  echo "Synced .claude/settings.json -> ${repo_name} (${target_settings})"
done
