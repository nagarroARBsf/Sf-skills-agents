---
description: Draw a Salesforce architecture diagram to Salesforce's standard, showing new, changed and unchanged components
argument-hint: "[landscape | solution | data-model | process | capability | roadmap | release-plan | role-hierarchy] [story IDs, Jira key or scope]"
---
Use the **sdlc-solution-architect-agent** subagent to draw the diagram.

Diagram and scope from the user: $ARGUMENTS

The agent follows the `sdlc-architecture-diagram` skill: establishes the baseline
(`node .claude/bin/sf-sdlc inventory`, and `delta` when code already exists), updates
`docs/sdlc/03-architecture/components.json`, writes the diagram spec in
`docs/sdlc/03-architecture/diagrams/`, generates the Salesforce-standard draw.io diagram
(`node .claude/bin/sf-sdlc diagram drawio`), checks it, exports a PNG (`diagram export`) and looks at it,
and adds a Mermaid text version. Every diagram has a header with title and one-sentence description,
the New / Changed / Unchanged / Removed overlay and a key. With no diagram type given it chooses the
type that answers the question and says why. Stop after showing where the diagram and image were
written, or that the image could not be exported.
