# Editing .drawio XML by hand

Read this only when a change cannot be expressed in the diagram spec (see
[drawio-spec.md](drawio-spec.md)). New diagrams always come from a spec. After any hand edit run
`sf-sdlc diagram check <file.drawio>`, then export and look at the image.

The XML rules below are adapted from Agents365-ai/drawio-skill (MIT licence,
https://github.com/Agents365-ai/drawio-skill), `references/xml-authoring.md`.

## File skeleton

```xml
<mxfile host="sf-sdlc">
  <diagram id="landscape" name="System landscape">
    <mxGraphModel grid="1" gridSize="10" page="1" pageWidth="1800" pageHeight="1200" background="#ffffff">
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <!-- shapes and connectors -->
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
```

- Cells `0` and `1` are required. Every other cell has a unique, meaningful id (`card-opp`), never
  `0` or `1`.
- Keep the file uncompressed (plain XML), so it diffs in Git and `diagram check` can read it. In
  draw.io: File → Properties → Compressed off.
- Escape `&`, `<`, `>`, `"` in attribute values. A line break inside `value` is `&#xa;`; inside an
  HTML label (`html=1`) it is `<br>` (escaped: `&lt;br&gt;`).
- Never put `--` inside an XML comment.

## Shapes and containers

```xml
<mxCell id="card-opp" value="" style="rounded=1;arcSize=14;absoluteArcSize=1;html=1;fillColor=#ffffff;strokeColor=#747474;strokeWidth=1.5;container=1;collapsible=0;sfRole=card;sfStatus=unchanged;" vertex="1" parent="group-data">
  <mxGeometry x="20" y="70" width="280" height="140" as="geometry"/>
</mxCell>
```

- A child's `parent` is its container's id and its `x`/`y` are relative to that container.
- Containers carry `container=1;collapsible=0;`; do not just lay a big box behind cards.
- Snap `x`, `y`, `width`, `height` to multiples of 10 where possible.

## Connectors

```xml
<mxCell id="edge-1" value="" style="edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;strokeColor=#032d60;strokeWidth=2;endArrow=block;endFill=1;exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=0;entryY=0.5;entryDx=0;entryDy=0;sfRole=connector;sfKind=sync;sfStatus=unchanged;" edge="1" parent="1" source="card-sales" target="card-mule">
  <mxGeometry relative="1" as="geometry"/>
</mxCell>
```

- **Every edge needs an expanded `<mxGeometry relative="1" as="geometry"/>` child.** A self-closing
  edge cell does not render.
- Elbow lines (`edgeStyle=orthogonalEdgeStyle`), as the Salesforce standard asks.
- When a card has two or more connectors on one side, pin `exitX/exitY/entryX/entryY` and spread
  them (three on the right side: `exitY` = 0.25, 0.5, 0.75) so they do not stack.
- Add waypoints (`<Array as="points"><mxPoint x="…" y="…"/></Array>` inside the geometry) when a
  line would cross an unrelated card; route along the gap between columns.
- Leave at least 20 px of straight line before an arrowhead.
- `flowAnimation=1` animates a connector (moving dashes) in draw.io and SVG exports.
- Crow's foot ends: `startArrow=ERzeroToMany` (child) with `endArrow=ERzeroToOne` (optional parent),
  `ERmandOne` (required parent) or `diamond;endFill=0` (master).

## Salesforce icons

`shape=mxgraph.salesforce.<name>` with the fill colours of that icon. Copy an existing icon cell from
a generated file rather than typing one; only the names in drawio-spec.md exist. A wrong name
renders as an empty box without any error — `diagram check` reports it.

## Roles the checker reads

The generator tags cells with `sfRole` (`header`, `key`, `group`, `card`, `status`, `footer`,
`connector`, `icon`), `sfStatus` and `sfKind`. Keep them when you copy cells: `diagram check` uses
them to confirm the diagram still has a header and a key, and to count cards.
