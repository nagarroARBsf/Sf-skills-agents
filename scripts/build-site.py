#!/usr/bin/env python3
"""Build the website (website/) into site/ (generated, git-ignored).

  website/src/index.html     page skeleton; <!-- @include path --> pulls in partials/ and sections/
  website/src/snippets/*.txt code samples, emitted as <script type="text/plain" id="<name>">
  website/src/styles/, scripts/  copied; links get ?v=<hash> so browsers pick up changes
  website/site.config.json   analytics and sign-up settings, exposed as window.SFSDLC_CONFIG
  website/assets/            images, copied to site/assets/
  website/media/             videos (git-ignored), copied to site/assets/ only if the page references them
  website/staticwebapp.config.json  Azure Static Web Apps settings
  site/downloads/*.zip       the plugin (plugins/sf-sdlc/) and the copy-in folder (.claude/)

website/api/ (the sign-up function) is not copied: it is deployed with --api-location.

Two sites are built from this script: the public kit site (website/ -> site/) and the client
showcase site (--client: sf-sdlc-client-website/ -> site-client/). The client site falls back to
website/media/ for videos it does not have in its own media/ folder.
Standard library only. Usage: python3 scripts/build-site.py [--client] [--no-zips]
"""
import hashlib
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENT = "--client" in sys.argv
WEB = ROOT / ("sf-sdlc-client-website" if CLIENT else "website")
SRC = WEB / "src"
SITE = ROOT / ("site-client" if CLIENT else "site")
MEDIA_DIRS = [WEB / "media"] + ([ROOT / "website" / "media"] if CLIENT else [])
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".sf", ".sfdx", ".sf-sdlc"}
SKIP_FILES = {"sf-sdlc.local.json", "settings.local.json", ".DS_Store", ".env"}
INCLUDE = re.compile(r"^[ \t]*<!-- @include ([\w./-]+) -->[ \t]*\n?", re.M)
ASSET_REF = re.compile(r'((?:href|src)=")((?:styles|scripts)/[\w.-]+\.(?:css|js))(")')


def fail(msg):
    sys.exit(f"build-site: {msg}")


def include(text, seen=()):
    def repl(m):
        rel = m.group(1)
        path = (SRC / rel).resolve()
        if SRC.resolve() not in path.parents or not path.is_file():
            fail(f"include not found: {rel}")
        if rel in seen:
            fail(f"include loop: {' -> '.join(seen + (rel,))}")
        body = path.read_text(encoding="utf-8")
        return include(body if body.endswith("\n") else body + "\n", seen + (rel,))
    return INCLUDE.sub(repl, text)


def snippets():
    out = []
    for p in sorted((SRC / "snippets").glob("*.txt")):
        body = p.read_text(encoding="utf-8")
        if "</script" in body.lower():
            fail(f"{p.name} contains </script, which would end the block early")
        out.append(f'<script type="text/plain" id="{p.stem}">{body}</script>')
    return "\n".join(out)


def config_script():
    cfg = json.loads((WEB / "site.config.json").read_text(encoding="utf-8"))
    data = json.dumps(cfg, separators=(",", ":")).replace("<", "\\u003c")
    # lead.enabled false hides every sign-up button and prompt before the page paints
    hide = "" if cfg.get("lead", {}).get("enabled", True) else "document.documentElement.classList.add('no-lead');"
    return f"<script>window.SFSDLC_CONFIG = {data};{hide}</script>"


def fingerprint(html):
    def repl(m):
        f = SITE / m.group(2)
        if not f.is_file():
            fail(f"referenced file missing: {m.group(2)}")
        return f"{m.group(1)}{m.group(2)}?v={hashlib.sha256(f.read_bytes()).hexdigest()[:10]}{m.group(3)}"
    return ASSET_REF.sub(repl, html)


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
    SITE.mkdir()
    for d in ("styles", "scripts"):
        shutil.copytree(SRC / d, SITE / d)
    shutil.copytree(WEB / "assets", SITE / "assets")
    html = include((SRC / "index.html").read_text(encoding="utf-8"))
    for marker, value in (("<!-- @snippets -->", snippets()), ("<!-- @config -->", config_script())):
        if marker not in html:
            fail(f"{marker} missing from src/index.html")
        html = html.replace(marker, value)
    if "<!-- @" in html:
        fail(f"unknown marker: {html[html.index('<!-- @'):][:60]}")
    # Only videos the page references are copied; videos hosted elsewhere (Google Drive) stay out of the package.
    for ref in sorted(set(re.findall(r'src="assets/([\w.-]+\.(?:mp4|webm))"', html))):
        v = next((d / ref for d in MEDIA_DIRS if (d / ref).is_file()), None)
        if v:
            shutil.copy(v, SITE / "assets" / ref)
            print(f"video {ref}: {v.stat().st_size / 1e6:.1f} MB")
        else:
            print(f"WARNING: assets/{ref} is used by the page but not in {WEB.name}/media/; the video will not play")
    (SITE / "index.html").write_text(fingerprint(html), encoding="utf-8")
    shutil.copy(WEB / "staticwebapp.config.json", SITE / "staticwebapp.config.json")

    if "--no-zips" not in sys.argv:
        (SITE / "downloads").mkdir()
        make_zip(ROOT / "plugins" / "sf-sdlc", SITE / "downloads" / "sf-sdlc-plugin.zip", "sf-sdlc")
        make_zip(ROOT / ".claude", SITE / "downloads" / "claude-folder.zip", ".claude")
    total = sum(p.stat().st_size for p in SITE.rglob("*") if p.is_file())
    print(f"{SITE.name}/: {total / 1e6:.1f} MB (Azure Static Web Apps Free plan limit: 250 MB)")
    if total > 240e6:
        print("WARNING: close to the 250 MB limit of the Free plan")


if __name__ == "__main__":
    main()
