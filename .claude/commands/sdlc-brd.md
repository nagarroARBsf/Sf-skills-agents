---
description: Generate or update a BRD from meeting notes, transcripts and emails (SDLC stage 1)
argument-hint: "[input files or folder] [project code]"
---
Use the **sdlc-brd-agent** subagent to generate the Business Requirements Document.

Inputs from the user: $ARGUMENTS

If no inputs were given, use `docs/sdlc/00-inputs/`; if that folder is empty, ask for the source
files. The agent follows the `sdlc-brd-generate` skill, writes `docs/sdlc/01-brd/BRD.md`, and
reports the blocking open questions. Stop after the report; do not start the next stage.
