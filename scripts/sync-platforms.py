#!/usr/bin/env python3
"""Generate the GitHub Copilot (.github/) and Cursor (.cursor/) harness from .claude/.

.claude/ is the single source of truth. Edit files there, then run:

    python3 scripts/sync-platforms.py          # regenerate .github/ and .cursor/
    python3 scripts/sync-platforms.py --check  # exit 1 if the generated folders are stale

What is generated:

    .claude/CLAUDE.md        -> .github/copilot-instructions.md   | .cursor/rules/00-project.mdc
    .claude/rules/*.md       -> .github/instructions/*.instructions.md | .cursor/rules/*.mdc
    .claude/agents/*.md      -> .github/agents/*.agent.md         | .cursor/agents/*.md
    .claude/commands/*.md    -> .github/prompts/*.prompt.md       | .cursor/commands/*.md
    .claude/skills/**        -> .github/skills/**                 | .cursor/skills/**   (verbatim)

Only the generated sub-paths are replaced; anything else under .github/ or .cursor/ is left alone.
Standard library only.
"""

from __future__ import annotations

import argparse
import filecmp
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / ".claude"

GENERATED_NOTE = (
    "<!-- Generated from {src} by scripts/sync-platforms.py. "
    "Edit the source in .claude/ and re-run the script; changes here are overwritten. -->"
)

# Path rewrites applied to agent, command, rule and CLAUDE.md bodies.
PATH_REWRITES = {
    "github": [
        (".claude/skills/", ".github/skills/"),
        (".claude/rules/", ".github/instructions/"),
        (".claude/agents/", ".github/agents/"),
        (".claude/commands/", ".github/prompts/"),
        (".claude/CLAUDE.md", ".github/copilot-instructions.md"),
    ],
    "cursor": [
        (".claude/skills/", ".cursor/skills/"),
        (".claude/rules/", ".cursor/rules/"),
        (".claude/agents/", ".cursor/agents/"),
        (".claude/commands/", ".cursor/commands/"),
        (".claude/CLAUDE.md", ".cursor/rules/00-project.mdc"),
    ],
}

# Copilot custom-agent handoffs (buttons shown after an agent finishes).
HANDOFFS = {
    "sdlc-brd-agent": [
        ("Create epics and stories", "sdlc-jira-story-agent",
         "Create the Jira backlog from docs/sdlc/01-brd/BRD.md."),
    ],
    "sdlc-jira-story-agent": [
        ("Design the solution", "sdlc-solution-architect-agent",
         "Write the HLD from docs/sdlc/01-brd/BRD.md and docs/sdlc/02-backlog/backlog.md, "
         "and list the stories that need an LLD."),
    ],
    "sdlc-solution-architect-agent": [
        ("Design test cases", "sdlc-qa-test-agent",
         "Design test cases for the stories that now have an LLD in docs/sdlc/03-architecture/LLD/."),
    ],
}

ARGS_TEXT = "(the text the user typed after the command, if any)"


# --------------------------------------------------------------------------- parsing

def split_frontmatter(text: str) -> tuple[dict, str]:
    """Parse the simple YAML front matter used in .claude/ sources.

    Supports `key: value`, quoted values, and `key:` followed by `  - item` lists.
    """
    m = re.match(r"^---\n(.*?)\n---\n?", text, re.S)
    if not m:
        return {}, text
    meta: dict = {}
    current_list: str | None = None
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        item = re.match(r"^\s+-\s+(.*)$", line)
        if item and current_list:
            meta[current_list].append(unquote(item.group(1)))
            continue
        kv = re.match(r"^([\w-]+):\s*(.*)$", line)
        if kv:
            key, value = kv.group(1), kv.group(2)
            if value == "":
                meta[key] = []
                current_list = key
            else:
                meta[key] = unquote(value)
                current_list = None
    return meta, text[m.end():]


def unquote(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def yaml_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def rewrite(body: str, platform: str) -> str:
    for old, new in PATH_REWRITES[platform]:
        body = body.replace(old, new)
    return body


def frontmatter(pairs: list[tuple[str, str]]) -> str:
    return "---\n" + "\n".join(f"{k}: {v}" for k, v in pairs) + "\n---\n"


# --------------------------------------------------------------------------- generators

def gen_project_instructions(out: Path) -> None:
    src = SRC / "CLAUDE.md"
    if not src.exists():
        return
    body = src.read_text(encoding="utf-8")
    note = GENERATED_NOTE.format(src=".claude/CLAUDE.md")

    write(out / ".github/copilot-instructions.md",
          note + "\n\n" + rewrite(body, "github"))
    write(out / ".cursor/rules/00-project.mdc",
          frontmatter([("description", yaml_str("Project-wide Salesforce and SDLC instructions")),
                       ("alwaysApply", "true")])
          + note + "\n\n" + rewrite(body, "cursor"))


def gen_rules(out: Path) -> None:
    for src in sorted((SRC / "rules").glob("*.md")):
        meta, body = split_frontmatter(src.read_text(encoding="utf-8"))
        paths = meta.get("paths") or []
        if isinstance(paths, str):
            paths = [p.strip() for p in paths.split(",")]
        desc = meta.get("description", src.stem)
        note = GENERATED_NOTE.format(src=f".claude/rules/{src.name}")

        write(out / f".github/instructions/{src.stem}.instructions.md",
              frontmatter([("description", yaml_str(desc)),
                           ("applyTo", yaml_str(",".join(paths) if paths else "**"))])
              + note + "\n" + rewrite(body, "github"))

        cursor_meta = [("description", yaml_str(desc))]
        if paths:
            cursor_meta += [("globs", ",".join(paths)), ("alwaysApply", "false")]
        else:
            cursor_meta += [("alwaysApply", "true")]
        write(out / f".cursor/rules/{src.stem}.mdc",
              frontmatter(cursor_meta) + note + "\n" + rewrite(body, "cursor"))


def gen_agents(out: Path) -> None:
    for src in sorted((SRC / "agents").glob("*.md")):
        meta, body = split_frontmatter(src.read_text(encoding="utf-8"))
        name = meta.get("name") or src.stem
        slug = src.stem
        desc = meta.get("description", "")
        note = GENERATED_NOTE.format(src=f".claude/agents/{src.name}")
        tools = meta.get("tools", "")
        readonly = bool(tools) and not re.search(r"\b(Write|Edit|Bash)\b", tools)

        # GitHub Copilot custom agent. Tools are omitted so the agent gets the workspace's
        # tools (file edit, terminal and any MCP servers, e.g. Jira).
        gh = [("name", yaml_str(slug)), ("description", yaml_str(desc))]
        handoffs = HANDOFFS.get(slug)
        gh_fm = frontmatter(gh)
        if handoffs:
            lines = ["handoffs:"]
            for label, agent, prompt in handoffs:
                lines += [f"  - label: {yaml_str(label)}",
                          f"    agent: {agent}",
                          f"    prompt: {yaml_str(prompt)}",
                          "    send: false"]
            gh_fm = gh_fm[:-4] + "\n".join(lines) + "\n---\n"
        write(out / f".github/agents/{slug}.agent.md",
              gh_fm + note + "\n" + rewrite(body, "github"))

        # Cursor subagent.
        cur = [("name", slug), ("description", yaml_str(desc)), ("model", "inherit"),
               ("readonly", "true" if readonly else "false")]
        write(out / f".cursor/agents/{slug}.md",
              frontmatter(cur) + note + "\n" + rewrite(body, "cursor"))


SUBAGENT_RE = re.compile(r"Use the \*\*([\w-]+)\*\* subagent to (\w)")


def gen_commands(out: Path) -> None:
    for src in sorted((SRC / "commands").glob("*.md")):
        meta, body = split_frontmatter(src.read_text(encoding="utf-8"))
        name = src.stem
        desc = meta.get("description", name)
        hint = meta.get("argument-hint", "")
        note = GENERATED_NOTE.format(src=f".claude/commands/{src.name}")
        body = body.replace("$ARGUMENTS", ARGS_TEXT)

        # Copilot prompt file: route to the custom agent instead of asking for a subagent.
        agent_match = SUBAGENT_RE.search(body)
        gh_body = body
        gh = [("name", name), ("description", yaml_str(desc))]
        if hint:
            gh.append(("argument-hint", yaml_str(hint)))
        if agent_match:
            gh.append(("agent", agent_match.group(1)))
            gh_body = SUBAGENT_RE.sub(lambda m: m.group(2).upper(), body, count=1)
        else:
            gh.append(("agent", "agent"))
        write(out / f".github/prompts/{name}.prompt.md",
              frontmatter(gh) + note + "\n" + rewrite(gh_body, "github"))

        # Cursor command: plain Markdown, invoked as /name.
        write(out / f".cursor/commands/{name}.md",
              f"{note}\n\n# /{name}\n\n{desc}\n\n" + rewrite(body.lstrip("\n"), "cursor"))


def gen_skills(out: Path) -> list[str]:
    warnings = []
    skills_src = SRC / "skills"
    for platform in (".github/skills", ".cursor/skills"):
        dest = out / platform
        dest.mkdir(parents=True, exist_ok=True)
        for item in sorted(skills_src.iterdir()):
            target = dest / item.name
            if item.is_dir():
                shutil.copytree(item, target, symlinks=False)
            else:
                shutil.copy2(item, target)

    for skill in sorted(p for p in skills_src.iterdir() if (p / "SKILL.md").is_file()):
        meta, _ = split_frontmatter((skill / "SKILL.md").read_text(encoding="utf-8"))
        if meta.get("name") != skill.name:
            warnings.append(f"{skill.name}: frontmatter name '{meta.get('name')}' != folder name "
                            "(Copilot and Cursor will not load it)")
        desc = meta.get("description", "")
        if isinstance(desc, str) and len(" ".join(desc.split())) > 1024:
            warnings.append(f"{skill.name}: description is {len(desc)} chars (> 1024 limit in the "
                            "Agent Skills spec; Copilot may skip it)")
    return warnings


# --------------------------------------------------------------------------- driver

GENERATED_PATHS = [
    ".github/copilot-instructions.md",
    ".github/instructions",
    ".github/agents",
    ".github/prompts",
    ".github/skills",
    ".cursor/rules",
    ".cursor/agents",
    ".cursor/commands",
    ".cursor/skills",
]


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def build(out: Path) -> list[str]:
    gen_project_instructions(out)
    gen_rules(out)
    gen_agents(out)
    gen_commands(out)
    return gen_skills(out)


def trees_equal(a: Path, b: Path) -> bool:
    if a.is_file() or b.is_file():
        return a.is_file() and b.is_file() and filecmp.cmp(a, b, shallow=False)
    if not (a.is_dir() and b.is_dir()):
        return False
    cmp = filecmp.dircmp(a, b)
    if cmp.left_only or cmp.right_only or cmp.funny_files:
        return False
    _, mismatch, errors = filecmp.cmpfiles(a, b, cmp.common_files, shallow=False)
    if mismatch or errors:
        return False
    return all(trees_equal(a / d, b / d) for d in cmp.common_dirs)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--check", action="store_true",
                        help="do not write; exit 1 if .github/ or .cursor/ are out of date")
    args = parser.parse_args()

    with tempfile.TemporaryDirectory() as tmp:
        staging = Path(tmp)
        warnings = build(staging)

        if args.check:
            stale = [p for p in GENERATED_PATHS
                     if (staging / p).exists() and not trees_equal(staging / p, ROOT / p)]
            for p in stale:
                print(f"stale: {p}")
            if stale:
                print("Run: python3 scripts/sync-platforms.py")
                return 1
            print("Generated folders are up to date.")
            return 0

        for rel in GENERATED_PATHS:
            dest = ROOT / rel
            if dest.is_dir():
                shutil.rmtree(dest)
            elif dest.exists():
                dest.unlink()
            src = staging / rel
            if src.is_dir():
                shutil.copytree(src, dest)
            elif src.exists():
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src, dest)

    counts = {
        "skills": sum(1 for p in (SRC / "skills").iterdir() if (p / "SKILL.md").is_file()),
        "agents": len(list((SRC / "agents").glob("*.md"))),
        "commands": len(list((SRC / "commands").glob("*.md"))),
        "rules": len(list((SRC / "rules").glob("*.md"))),
    }
    print("Synced .claude/ -> .github/ and .cursor/: "
          + ", ".join(f"{v} {k}" for k, v in counts.items()))
    for w in warnings:
        print(f"warning: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
