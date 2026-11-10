#!/usr/bin/env bash
# Refresh the official Salesforce skills (github.com/forcedotcom/sf-skills, Apache-2.0)
# listed in scripts/official-skills.txt into .claude/skills/ (or .claude/skill-library/ for skills already moved there), then regenerate .github/ and .cursor/.
#
#   scripts/update-official-skills.sh            # latest main
#   scripts/update-official-skills.sh <git-ref>   # a tag or commit
#   scripts/update-official-skills.sh --no-sync [<git-ref>]   # leave .github/ and .cursor/ untouched
#
# Only the listed folders are replaced. Nagarro skills (sdlc-*) and community skills (sf-*) are
# never touched. Review the git diff before committing.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
LIST="$ROOT/scripts/official-skills.txt"
LOCK="$ROOT/scripts/official-skills.lock"
DEST="$ROOT/.claude/skills"
LIB="$ROOT/.claude/skill-library"   # on-demand skills; a listed skill is refreshed where it already lives
SYNC=1
if [[ "${1:-}" == "--no-sync" ]]; then SYNC=0; shift; fi
REF="${1:-main}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

git clone --quiet --filter=blob:none https://github.com/forcedotcom/sf-skills.git "$TMP/sf-skills"
git -C "$TMP/sf-skills" checkout --quiet "$REF"

missing=0
while IFS= read -r skill; do
  [[ -z "$skill" || "$skill" == \#* ]] && continue
  src="$TMP/sf-skills/skills/$skill"
  if [[ ! -f "$src/SKILL.md" ]]; then
    # Some skills exist only inside an upstream plugin (plugins/<group>/<plugin>/skills/<skill>).
    src="$(find "$TMP/sf-skills/plugins" -type d -path "*/skills/$skill" -print -quit 2>/dev/null || true)"
  fi
  if [[ -z "$src" || ! -f "$src/SKILL.md" ]]; then
    echo "missing upstream (renamed or removed?): $skill" >&2
    missing=$((missing + 1))
    continue
  fi
  target="$LIB"   # official skills live in the library; a project installs the ones it needs
  [[ -d "$DEST/$skill" ]] && target="$DEST"
  rm -rf "${target:?}/$skill"
  cp -R "$src" "$target/$skill"
done < "$LIST"

cp "$TMP/sf-skills/LICENSE.txt" "$LIB/LICENSE-forcedotcom-sf-skills.txt"
git -C "$TMP/sf-skills" log -1 --format='%H %cs' > "$LOCK"
echo "Pinned forcedotcom/sf-skills at $(cat "$LOCK")"

echo "New upstream skills not in the list (add them to official-skills.txt if wanted):"
comm -13 <(grep -v '^#' "$LIST" | sort) <(ls "$TMP/sf-skills/skills" | sort) | sed 's/^/  /' | head -50

if (( SYNC )); then
  python3 "$ROOT/scripts/sync-platforms.py"
else
  echo "Skipped the Copilot/Cursor sync (--no-sync). Run scripts/sync-platforms.py when you want them regenerated."
fi
echo "Now run: python3 scripts/build-claude-plugin.py"

if (( missing > 0 )); then
  echo "$missing listed skill(s) were not found upstream; update official-skills.txt." >&2
  exit 1
fi
