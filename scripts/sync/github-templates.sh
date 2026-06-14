#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MANIFEST_FILE="${WORKSPACE_ROOT}/workspace.yaml"
DRY_RUN=false

usage() {
  cat <<'USAGE'
Usage: ./scripts/sync/github-templates.sh [--dry-run] [repo...]

Sync workspace-owned GitHub issue and pull request templates into configured
child repositories. This script copies only allowlisted template files and never
touches child repository workflows.
USAGE
}

REPO_FILTERS=()
for arg in "$@"; do
  case "${arg}" in
    --dry-run)
      DRY_RUN=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --*)
      echo "Error: unknown argument ${arg}" >&2
      usage >&2
      exit 1
      ;;
    *)
      REPO_FILTERS+=("${arg}")
      ;;
  esac
done

if [[ ! -f "${MANIFEST_FILE}" ]]; then
  echo "Error: manifest not found at ${MANIFEST_FILE}" >&2
  exit 1
fi

template_files=(
  ".github/PULL_REQUEST_TEMPLATE/default.md"
  ".github/PULL_REQUEST_TEMPLATE/cross-repo.md"
  ".github/PULL_REQUEST_TEMPLATE/docs-maintenance.md"
  ".github/ISSUE_TEMPLATE/cross-repo-change.md"
  ".github/ISSUE_TEMPLATE/docs-maintenance.md"
)

for file in "${template_files[@]}"; do
  if [[ ! -f "${WORKSPACE_ROOT}/${file}" ]]; then
    echo "Error: missing source template ${file}" >&2
    exit 1
  fi
done

strip_quotes() {
  local value="$1"
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"
  printf '%s' "$value"
}

includes_repo() {
  local repo_name="$1"
  if [[ ${#REPO_FILTERS[@]} -eq 0 ]]; then
    return 0
  fi

  local filter
  for filter in "${REPO_FILTERS[@]}"; do
    if [[ "${filter}" == "${repo_name}" ]]; then
      return 0
    fi
  done

  return 1
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

echo "GitHub template sync source: ${WORKSPACE_ROOT}/.github"
if [[ "${DRY_RUN}" == true ]]; then
  echo "Dry run: no files will be written"
fi

matched_filters=()

for i in "${!REPO_NAMES[@]}"; do
  repo_name="${REPO_NAMES[$i]}"
  repo_path="${REPO_PATHS[$i]}"

  if ! includes_repo "${repo_name}"; then
    continue
  fi
  matched_filters+=("${repo_name}")

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

  for file in "${template_files[@]}"; do
    source_file="${WORKSPACE_ROOT}/${file}"
    target_file="${target_repo}/${file}"

    if [[ "${DRY_RUN}" == true ]]; then
      echo "Would sync ${file} -> ${repo_name}"
      continue
    fi

    mkdir -p "$(dirname "${target_file}")"
    cp "${source_file}" "${target_file}"
  done

  if [[ "${DRY_RUN}" != true ]]; then
    echo "Synced GitHub templates -> ${repo_name}"
  fi
done

if [[ ${#REPO_FILTERS[@]} -gt 0 ]]; then
  for filter in "${REPO_FILTERS[@]}"; do
    found=false
    for matched in "${matched_filters[@]}"; do
      if [[ "${filter}" == "${matched}" ]]; then
        found=true
        break
      fi
    done
    if [[ "${found}" == false ]]; then
      echo "Error: unknown repository filter ${filter}" >&2
      exit 1
    fi
  done
fi
