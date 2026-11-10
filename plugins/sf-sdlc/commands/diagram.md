---
description: Draw a Salesforce architecture diagram showing new, changed and unchanged components
argument-hint: "[landscape | solution | data-model | process | capability | roadmap] [story IDs or scope]"
---
<!-- Generated from .claude/commands/sdlc-diagram.md by scripts/build-claude-plugin.py. Edit the source in .claude/ and re-run the script; changes here are overwritten. -->
Use the **sf-sdlc:sdlc-solution-architect-agent** subagent to draw the diagram.

Diagram and scope from the user: $ARGUMENTS

The agent follows the `sdlc-architecture-diagram` skill: establishes the baseline
(`sf-sdlc inventory`, and `delta` when code already exists), updates
`docs/sdlc/03-architecture/components.json`, and writes one Mermaid diagram per message with a title,
a one-sentence description, the New / Changed / Unchanged / Removed overlay and a Key. With no
diagram type given it chooses the type that answers the question and says why. Stop after showing
where the diagram was written.
