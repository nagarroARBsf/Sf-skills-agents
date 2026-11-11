#!/usr/bin/env python3
"""Build the static docs site into site/ (generated, git-ignored).

site/index.html, site/assets/         copy of docs/index.html and docs/assets/
site/assets/sf_sdlc_tutorial.mp4     sf_sdlc_tutorial_v1.0.mp4 from the repo root
site/downloads/sf-sdlc-plugin.zip     plugins/sf-sdlc/   (the Claude Code plugin)
site/downloads/claude-folder.zip      .claude/           (the copy-in folder)
site/staticwebapp.config.json         Azure Static Web Apps settings

Standard library only. Run from anywhere; deploy with scripts/deploy-site.sh.
"""
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".sf", ".sfdx", ".sf-sdlc"}
SKIP_FILES = {"sf-sdlc.local.json", "settings.local.json", ".DS_Store"}

CONFIG = {
    "navigationFallback": {"rewrite": "/index.html", "exclude": ["/downloads/*"]},
    "mimeTypes": {".zip": "application/zip", ".mp4": "video/mp4"},
    "globalHeaders": {
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
    },
}


def add_tree(zf, src, arcroot):
    n = 0
    for p in sorted(src.rglob("*")):
        rel = p.relative_to(src)
        if any(part in SKIP_DIRS for part in rel.parts) or p.name in SKIP_FILES:
            continue
        if p.is_symlink() or not p.is_file():
            continue
        zf.write(p, f"{arcroot}/{rel.as_posix()}")
        n += 1
    return n


def make_zip(src, out, arcroot):
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        n = add_tree(zf, src, arcroot)
    print(f"{out.relative_to(ROOT)}: {n} files, {out.stat().st_size / 1e6:.1f} MB")


def main():
    if SITE.exists():
        shutil.rmtree(SITE)
    (SITE / "downloads").mkdir(parents=True)
    shutil.copy(ROOT / "docs" / "index.html", SITE / "index.html")
    shutil.copytree(ROOT / "docs" / "assets", SITE / "assets")
    video = ROOT / "sf_sdlc_tutorial_v1.0.mp4"
    if video.exists():
        shutil.copy(video, SITE / "assets" / "sf_sdlc_tutorial.mp4")
        print(f"tutorial video: {video.stat().st_size / 1e6:.1f} MB")
    else:
        print("WARNING: sf_sdlc_tutorial_v1.0.mp4 not found; the tutorial section will not play")
    (SITE / "staticwebapp.config.json").write_text(json.dumps(CONFIG, indent=2) + "\n")
    make_zip(ROOT / "plugins" / "sf-sdlc", SITE / "downloads" / "sf-sdlc-plugin.zip", "sf-sdlc")
    make_zip(ROOT / ".claude", SITE / "downloads" / "claude-folder.zip", ".claude")


if __name__ == "__main__":
    main()
