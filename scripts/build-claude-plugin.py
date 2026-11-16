#!/usr/bin/env python3
"""Generate the Claude Code plugin (plugins/sf-sdlc/) from .claude/.

.claude/ stays the single source of truth. Edit files there, then run:

    python3 scripts/build-claude-plugin.py          # regenerate the generated paths
    python3 scripts/build-claude-plugin.py --check  # exit 1 if anything generated is stale

What is generated:

    .claude/catalog/skills.json           index of every skill (also read by `sf-sdlc skills`)
    .claude/skill-library/README.md       human-readable index of the library

    plugins/sf-sdlc/
      agents/*.md           <- .claude/agents/*.md        (paths rewritten, commands namespaced)
      commands/*.md         <- .claude/commands/*.md      (`sdlc-`/`sdd-` prefix dropped: /sf-sdlc:brd)
      skills/**             <- .claude/skills/**          (+ salesforce-coding-rules from rules with paths:)
      skill-library/**      <- .claude/skill-library/**   (verbatim; never loaded, installed per project)
      context/              <- .claude/CLAUDE.md + always-on rules (printed by the SessionStart hook)
      hooks/                <- .claude/hooks/*.js + hooks.json built from .claude/settings.json
      bin/, catalog/, output-styles/, workflows/           (copied)
      templates/            <- .claude/templates/ + project-settings.json (settings.json without hooks)
                               + project/rules/ (CLAUDE.md as an always-on rule, and the rules), which
                               `sf-sdlc init` copies into a plugin user's .claude/rules/

Hand-written plugin files are left alone: .claude-plugin/plugin.json, .mcp.json, monitors/, themes/,
README.md, NOTICE. Standard library only.
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / ".claude"
PLUGIN_NAME = "sf-sdlc"
PLUGIN = ROOT / "plugins" / PLUGIN_NAME
RULES_SKILL = "salesforce-coding-rules"
ON_DEMAND = "skill-library"

# Reuse the frontmatter parser and helpers from the Copilot/Cursor generator.
_spec = importlib.util.spec_from_file_location("sync_platforms", ROOT / "scripts" / "sync-platforms.py")
sp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sp)

GENERATED_NOTE = (
    "<!-- Generated from {src} by scripts/build-claude-plugin.py. "
    "Edit the source in .claude/ and re-run the script; changes here are overwritten. -->"
)

PR = "${CLAUDE_PLUGIN_ROOT}"
# Order matters: specific prefixes first. `.claude/skills/` on its own is NOT rewritten: in bodies it
# means the project's own installed skills, which is the same place for plugin users.
PATH_REWRITES = [
    ("node .claude/bin/sf-sdlc", "sf-sdlc"),
    (".claude/skills/sdlc-", f"{PR}/skills/sdlc-"),
    (".claude/skill-library/", f"{PR}/skill-library/"),
    (".claude/rules/", f"{PR}/skills/{RULES_SKILL}/references/"),
    (".claude/catalog/", f"{PR}/catalog/"),
    (".claude/templates/", f"{PR}/templates/"),
    ("`.claude/bin/sf-sdlc`", "`sf-sdlc`"),
]

# Sentences in .claude/CLAUDE.md that only make sense for the copy-in folder.
CLAUDE_MD_REWRITES = [
    ("Detailed, file-type-specific rules live in `.claude/rules/` and load when matching files are opened.",
     f"Detailed, file-type-specific rules are in the `{RULES_SKILL}` skill: load it before writing or "
     "reviewing Apex, LWC, metadata XML or SDLC documents."),
]

GENERATED_PATHS = ["agents", "commands", "skills", ON_DEMAND, "context", "hooks", "bin", "catalog",
                   "output-styles", "workflows", "templates"]
GENERATED_SOURCE_FILES = ["catalog/skills.json", f"{ON_DEMAND}/README.md"]  # written back into .claude/

COMMAND_NAMES = sorted(p.stem for p in (SRC / "commands").glob("*.md"))


def plugin_command(name: str) -> str:
    return re.sub(r"^(sdlc|sdd)-", "", name)


_CMD_RE = re.compile(r"(?<![\w/.\-$}])/(" + "|".join(re.escape(c) for c in COMMAND_NAMES) + r")(?![\w-])")


def rewrite(body: str) -> str:
    for old, new in PATH_REWRITES:
        body = body.replace(old, new)
    # /sdlc-brd -> /sf-sdlc:brd (only for names that are real commands)
    return _CMD_RE.sub(lambda m: f"/{PLUGIN_NAME}:{plugin_command(m.group(1))}", body)


def namespace_subagents(body: str) -> str:
    """`Use the **x** subagent` -> `Use the **sf-sdlc:x** subagent` (plugin agent type)."""
    return sp.SUBAGENT_RE.sub(
        lambda m: m.group(0).replace(f"**{m.group(1)}**", f"**{PLUGIN_NAME}:{m.group(1)}**"), body)


def rules() -> list[tuple[Path, dict, str]]:
    out = []
    for src in sorted((SRC / "rules").glob("*.md")):
        meta, body = sp.split_frontmatter(src.read_text(encoding="utf-8"))
        paths = meta.get("paths") or []
        if isinstance(paths, str):
            paths = [p.strip() for p in paths.split(",")]
        meta["paths"] = paths
        out.append((src, meta, body))
    return out


# --------------------------------------------------------------------------- catalog (written into .claude/)

# Other skills vendored verbatim from their own repositories (see NOTICE): name -> "repo@commit".
THIRD_PARTY_SKILLS = {"drawio-skill": "Agents365-ai/drawio-skill@6550495"}


def official_skills() -> set[str]:
    lines = (ROOT / "scripts" / "official-skills.txt").read_text(encoding="utf-8").splitlines()
    return {l.strip() for l in lines if l.strip() and not l.startswith("#")}


def skill_entries(warnings: list[str]) -> list[dict]:
    official = official_skills()
    entries = []
    for location in ("skills", ON_DEMAND):
        for d in sorted(p for p in (SRC / location).iterdir() if (p / "SKILL.md").is_file()):
            meta, _ = sp.split_frontmatter((d / "SKILL.md").read_text(encoding="utf-8"))
            desc = " ".join(str(meta.get("description", "")).split())
            if meta.get("name") != d.name:
                warnings.append(f"{location}/{d.name}: frontmatter name '{meta.get('name')}' != folder name")
            if len(desc) > 1024:
                warnings.append(f"{location}/{d.name}: description is {len(desc)} chars (> 1,024)")
            source = ("nagarro" if d.name.startswith("sdlc-") else "official" if d.name in official
                      else "community" if d.name.startswith("sf-")
                      else "third-party" if d.name in THIRD_PARTY_SKILLS else "other")
            entries.append({"name": d.name, "location": location, "source": source,
                            "description": desc[:300]})
    return entries


def catalog_json(entries: list[dict]) -> str:
    lock = (ROOT / "scripts" / "official-skills.lock").read_text(encoding="utf-8").split()
    doc = {
        "$comment": "Generated by scripts/build-claude-plugin.py from skill frontmatter. Do not edit.",
        "officialSource": {"repo": "forcedotcom/sf-skills", "commit": lock[0] if lock else "", "date": lock[1] if len(lock) > 1 else ""},
        "skills": entries,
    }
    return json.dumps(doc, indent=2, ensure_ascii=False) + "\n"


LIBRARY_README = """\
# Skill library (installed per project)

Skills here are **not loaded** by Claude Code, so they add nothing to any session. Only the SDLC
process skills in `skills/` are always available. A project installs the Salesforce skills it
actually needs:

```bash
node .claude/bin/sf-sdlc skills recommend          # what this project needs, with the evidence
node .claude/bin/sf-sdlc skills install <names>    # copy them into the project's .claude/skills/
node .claude/bin/sf-sdlc skills list               # installed skills and their listing size
node .claude/bin/sf-sdlc skills sync               # update after upgrading the kit
```

or run `/sdlc-skills`. Installed skills are recorded in `.claude/sf-sdlc.skills.lock.json`; a skill
edited in the project is never overwritten by `sync`.

Sources: `official` skills are vendored unmodified from
[forcedotcom/sf-skills](https://github.com/forcedotcom/sf-skills) (Apache-2.0, see
`LICENSE-forcedotcom-sf-skills.txt`); `community` skills (`sf-*`) come from
[Clientell-Ai/salesforce-skills](https://github.com/Clientell-Ai/salesforce-skills) (Apache-2.0);
`third-party` skills are vendored unmodified from their own repositories (`drawio-skill`:
[Agents365-ai/drawio-skill](https://github.com/Agents365-ai/drawio-skill), MIT, commit 6550495).
See `NOTICE` at the repository root.

## Index

| Skill | Source | What it does |
|---|---|---|
"""


def library_readme(entries: list[dict]) -> str:
    rows = []
    for e in entries:
        if e["location"] != ON_DEMAND:
            continue
        first = re.split(r"(?<=[a-z0-9)])\. |\s+TRIGGER", e["description"])[0][:150].replace("|", "\\|")
        rows.append(f"| `{e['name']}` | {e['source']} | {first} |")
    return LIBRARY_README + "\n".join(rows) + "\n"


# --------------------------------------------------------------------------- plugin generators

def gen_context(out: Path, warnings: list[str]) -> None:
    """CLAUDE.md plus always-on rules, printed into every session by the SessionStart hook."""
    body = (SRC / "CLAUDE.md").read_text(encoding="utf-8")
    for old, new in CLAUDE_MD_REWRITES:
        if old not in body:
            warnings.append(f"CLAUDE.md no longer contains {old[:60]!r}...; update CLAUDE_MD_REWRITES")
        body = body.replace(old, new)
    parts = [GENERATED_NOTE.format(src=".claude/CLAUDE.md and always-on .claude/rules/"), "", rewrite(body).rstrip()]
    for src, meta, rule_body in rules():
        if not meta["paths"]:
            parts += ["", rewrite(rule_body).strip()]
    text = "\n".join(parts) + "\n"
    if len(text) > 9000:
        warnings.append(f"context/project-instructions.md is {len(text)} chars; SessionStart output is capped at 10,000")
    sp.write(out / "context/project-instructions.md", text)


def gen_rules_skill(out: Path) -> None:
    scoped = [(s, m, b) for s, m, b in rules() if m["paths"]]
    rows = []
    for src, meta, body in scoped:
        note = GENERATED_NOTE.format(src=f".claude/rules/{src.name}")
        sp.write(out / f"skills/{RULES_SKILL}/references/{src.name}", note + "\n" + rewrite(body))
        globs = ", ".join(f"`{p}`" for p in meta["paths"])
        rows.append(f"| [{src.stem}](references/{src.name}) | {globs} | {meta.get('description', '')} |")

    desc = ("Salesforce coding and documentation rules for this delivery kit: Apex and triggers (security, "
            "bulkification, structure), Apex tests, Lightning Web Components, metadata XML, and SDLC "
            "document conventions. TRIGGER when: writing, editing or reviewing .cls, .trigger, LWC "
            "files, *-meta.xml metadata, or documents under docs/sdlc/ or specs/; load it alongside the "
            "skill doing the work. DO NOT TRIGGER for files outside Salesforce source or SDLC documents.")
    fm = sp.frontmatter([("name", RULES_SKILL), ("description", sp.yaml_str(desc))])
    body = "\n".join([
        GENERATED_NOTE.format(src=".claude/rules/*.md (rules with paths:)"),
        "",
        f"# {RULES_SKILL}",
        "",
        "Project coding rules that apply on top of the specialist skills. Before writing or reviewing a",
        "file, read **every** reference below whose globs match it, and follow it over generic habits.",
        "",
        "| Rule | Applies to | Covers |",
        "|---|---|---|",
        *rows,
        "",
    ])
    sp.write(out / f"skills/{RULES_SKILL}/SKILL.md", fm + body)


def gen_agents(out: Path) -> None:
    for src in sorted((SRC / "agents").glob("*.md")):
        text = src.read_text(encoding="utf-8")
        _, body = sp.split_frontmatter(text)
        fm = text[: len(text) - len(body)]
        note = GENERATED_NOTE.format(src=f".claude/agents/{src.name}")
        sp.write(out / f"agents/{src.name}", fm + note + "\n" + rewrite(body))


def gen_commands(out: Path) -> None:
    for src in sorted((SRC / "commands").glob("*.md")):
        text = src.read_text(encoding="utf-8")
        _, body = sp.split_frontmatter(text)
        fm = text[: len(text) - len(body)].replace("node .claude/bin/sf-sdlc", "sf-sdlc")
        note = GENERATED_NOTE.format(src=f".claude/commands/{src.name}")
        sp.write(out / f"commands/{plugin_command(src.stem)}.md", fm + note + "\n" + namespace_subagents(rewrite(body)))


def gen_skills(out: Path, warnings: list[str], entries: list[dict]) -> None:
    shutil.copytree(SRC / "skills", out / "skills", dirs_exist_ok=True)
    shutil.copytree(SRC / ON_DEMAND, out / ON_DEMAND)
    if (SRC / "skills" / RULES_SKILL).exists():
        warnings.append(f".claude/skills/{RULES_SKILL} exists and is overwritten by the generated rules skill")
    # The kit's own skills refer to the kit by path and command name; point them at the plugin.
    for md in (out / "skills").rglob("*.md"):
        text = md.read_text(encoding="utf-8")
        new = rewrite(text)
        if new != text:
            md.write_text(new, encoding="utf-8")
    (out / ON_DEMAND / "README.md").write_text(rewrite(library_readme(entries)), encoding="utf-8")


def gen_hooks(out: Path) -> None:
    dest = out / "hooks"
    dest.mkdir(parents=True, exist_ok=True)
    for js in sorted((SRC / "hooks").glob("*.js")):
        shutil.copy2(js, dest / js.name)
    settings = json.loads((SRC / "settings.json").read_text(encoding="utf-8"))
    hooks = json.loads(json.dumps(settings["hooks"]).replace("$CLAUDE_PROJECT_DIR/.claude/", "${CLAUDE_PLUGIN_ROOT}/"))
    doc = {
        "description": "sf-sdlc: project facts at session start; production-org, secret, branch and commit "
                       "guards; Salesforce source checks on write; deployment failure triage; audit log.",
        "hooks": hooks,
    }
    (dest / "hooks.json").write_text(json.dumps(doc, indent=2) + "\n", encoding="utf-8")


def gen_copies(out: Path, entries: list[dict]) -> None:
    shutil.copytree(SRC / "bin", out / "bin")
    for f in (out / "bin").iterdir():
        f.chmod(0o755)
    shutil.copytree(SRC / "catalog", out / "catalog")
    (out / "catalog" / "skills.json").write_text(catalog_json(entries), encoding="utf-8")
    for name in ("output-styles", "workflows"):
        shutil.copytree(SRC / name, out / name)
        for f in (out / name).iterdir():
            f.write_text(rewrite(f.read_text(encoding="utf-8")), encoding="utf-8")
    shutil.copytree(SRC / "templates", out / "templates")
    settings = json.loads((SRC / "settings.json").read_text(encoding="utf-8"))
    settings.pop("hooks", None)  # the plugin supplies the hooks
    text = json.dumps(settings, indent=2).replace("node .claude/bin/sf-sdlc", "sf-sdlc")
    (out / "templates" / "project-settings.json").write_text(text + "\n", encoding="utf-8")


PROJECT_NOTE = (
    "<!-- Installed by `sf-sdlc init` from the sf-sdlc plugin (generated from .claude/{src}). "
    "Re-running init updates this file while it is unchanged; once you edit it, it is yours and is kept. -->"
)
KIT_RULE_FILE = "sf-sdlc-kit.md"  # keep in step with KIT_RULE_FILE in .claude/hooks/lib.js
# Kit paths that exist only inside the plugin: a project file cannot reach them (no ${CLAUDE_PLUGIN_ROOT}).
PLUGIN_ONLY_PATHS = (".claude/skills/sdlc-", ".claude/skill-library/", ".claude/catalog/", ".claude/templates/")


def rewrite_project(body: str) -> str:
    """For files copied into a project: CLI and command names only; .claude/rules/ stays where it is."""
    body = body.replace("node .claude/bin/sf-sdlc", "sf-sdlc").replace("`.claude/bin/sf-sdlc`", "`sf-sdlc`")
    return _CMD_RE.sub(lambda m: f"/{PLUGIN_NAME}:{plugin_command(m.group(1))}", body)


def gen_project_files(out: Path, warnings: list[str]) -> None:
    """templates/project/rules/: what `sf-sdlc init` copies into a plugin user's .claude/rules/.

    Plugins cannot ship CLAUDE.md or path-scoped rules, so the kit instructions become an always-on
    project rule (no paths:) and every rule keeps its paths: frontmatter.
    """
    dest = out / "templates" / "project" / "rules"
    claude_md = (SRC / "CLAUDE.md").read_text(encoding="utf-8")
    sources = [("CLAUDE.md", claude_md)] + [(f"rules/{p.name}", p.read_text(encoding="utf-8")) for p in sorted((SRC / "rules").glob("*.md"))]
    for name, text in sources:
        for p in PLUGIN_ONLY_PATHS:
            if p in text:
                warnings.append(f".claude/{name} names {p}, which a project rule cannot reach; reword it")
    parts = [PROJECT_NOTE.format(src="CLAUDE.md"), "", rewrite_project(claude_md).rstrip(), ""]
    sp.write(dest / KIT_RULE_FILE, "\n".join(parts))
    for src, meta, body in rules():
        text = src.read_text(encoding="utf-8")
        fm = text[: len(text) - len(body)]
        sp.write(dest / src.name, fm + PROJECT_NOTE.format(src=f"rules/{src.name}") + "\n" + rewrite_project(body))


# --------------------------------------------------------------------------- driver

def build(out: Path) -> tuple[list[str], list[dict]]:
    warnings: list[str] = []
    entries = skill_entries(warnings)
    gen_skills(out, warnings, entries)
    gen_rules_skill(out)
    gen_context(out, warnings)
    gen_agents(out)
    gen_commands(out)
    gen_hooks(out)
    gen_copies(out, entries)
    gen_project_files(out, warnings)
    return warnings, entries


def source_files(entries: list[dict]) -> dict[str, str]:
    return {"catalog/skills.json": catalog_json(entries), f"{ON_DEMAND}/README.md": library_readme(entries)}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true",
                        help=f"do not write; exit 1 if plugins/{PLUGIN_NAME}/ or the catalog is out of date")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        staging = Path(tmp)
        warnings, entries = build(staging)
        generated = source_files(entries)

        if args.check:
            stale = [f"plugins/{PLUGIN_NAME}/{p}" for p in GENERATED_PATHS if not sp.trees_equal(staging / p, PLUGIN / p)]
            for rel, text in generated.items():
                f = SRC / rel
                if not f.is_file() or f.read_text(encoding="utf-8") != text:
                    stale.append(f".claude/{rel}")
            for p in stale:
                print(f"stale: {p}")
            if stale:
                print("Run: python3 scripts/build-claude-plugin.py")
                return 1
            print("Plugin and catalog are up to date.")
            return 0

        for rel, text in generated.items():
            (SRC / rel).parent.mkdir(parents=True, exist_ok=True)
            (SRC / rel).write_text(text, encoding="utf-8")
        for rel in GENERATED_PATHS:
            dest = PLUGIN / rel
            if dest.is_dir():
                shutil.rmtree(dest)
            shutil.copytree(staging / rel, dest)

    def n(d): return sum(1 for p in (PLUGIN / d).iterdir() if (p / "SKILL.md").is_file())

    print(f"Built plugins/{PLUGIN_NAME}/: {n('skills')} always-available skills, {n(ON_DEMAND)} library skills, "
          f"{len(list((PLUGIN / 'agents').glob('*.md')))} agents, "
          f"{len(list((PLUGIN / 'commands').glob('*.md')))} commands, "
          f"{len(list((PLUGIN / 'workflows').glob('*.js')))} workflows")
    for w in warnings:
        print(f"warning: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
