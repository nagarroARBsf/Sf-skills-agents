export const meta = {
  name: 'sdlc-stories-fanout',
  description: 'Write the low-level design or the test cases for many stories at once, one agent per story',
  phases: [{ title: 'Select' }, { title: 'Write' }, { title: 'Check' }],
}

// args: "lld" or "test-cases", optionally followed by story IDs or an epic, e.g. "lld EPIC-04" or "test-cases US-04-01 US-04-02".
const input = typeof args === 'string' ? args.trim() : ''
const kind = /^test/i.test(input) ? 'test-cases' : 'lld'
const filter = input.replace(/^\S+\s*/, '')

phase('Select')
const sel = await agent(
  'Read `.claude/sf-sdlc.json` for paths.docs, then the backlog at <docs>/02-backlog/backlog.md. ' +
    `List the story IDs (US-nn-mm) in scope: ${filter || 'every story that is not marked Not Ready'}. ` +
    (kind === 'lld'
      ? 'Exclude stories that already have a file under <docs>/03-architecture/LLD/. Also report whether <docs>/03-architecture/HLD.md exists.'
      : 'Exclude stories that already have a file under <docs>/04-qa/test-cases/. Mark which stories have an LLD.') +
    ' Do not write anything.',
  {
    label: 'select',
    schema: {
      type: 'object',
      required: ['stories'],
      properties: {
        stories: { type: 'array', items: { type: 'string' } },
        hldExists: { type: 'boolean' },
        skipped: { type: 'array', items: { type: 'string' } },
      },
    },
  },
)
if (!sel || !sel.stories.length) return { kind, written: [], note: 'No stories in scope.' }
if (kind === 'lld' && sel.hldExists === false) {
  return { kind, written: [], note: 'No HLD yet. Run the architecture command for the HLD first: per-story designs depend on it.' }
}

const RESULT = {
  type: 'object',
  required: ['story', 'file', 'status'],
  properties: {
    story: { type: 'string' },
    file: { type: 'string' },
    status: { type: 'string', enum: ['written', 'blocked'] },
    openItems: { type: 'array', items: { type: 'string' } },
  },
}

const write = (story) =>
  kind === 'lld'
    ? `Follow the sdlc-solution-architecture-generate and sdlc-architecture-diagram skills. Write the low-level design for story ${story} only, as a draft for review, at <docs>/03-architecture/LLD/${story}.md. ` +
      'Read the HLD and the baseline inventory first, give every component a change status (New, Changed, Unchanged, Removed), and do not edit the HLD, components.json or any other story\'s file — report additions for them as open items instead.'
    : `Follow the sdlc-qa-test-case-generate skill. Design the test cases for story ${story} only, as a draft for review, at <docs>/04-qa/test-cases/${story}.md. ` +
      'Do not edit test-cases.csv, rtm.md or any other story\'s file — they are rebuilt afterwards.'

const written = await pipeline(sel.stories, (story) => agent(write(story), { label: `${kind}:${story}`, phase: 'Write', schema: RESULT }))

phase('Check')
const done = written.filter(Boolean)
const merge = await agent(
  (kind === 'lld'
    ? 'Follow the sdlc-solution-architecture-generate skill. Update the story-to-design map in the HLD and <docs>/03-architecture/components.json so they include these new low-level designs. Report any two designs that change the same component in conflicting ways.'
    : 'Follow the sdlc-qa-test-case-generate skill. Rebuild <docs>/04-qa/test-cases.csv and <docs>/04-qa/rtm.md from all test-case files. Report acceptance criteria that still have no test case.') +
    `\nFiles written in this run:\n${done.map((d) => d.file).join('\n')}`,
  { label: 'merge', schema: { type: 'object', required: ['summary'], properties: { summary: { type: 'string' }, conflicts: { type: 'array', items: { type: 'string' } } } } },
)

return {
  kind,
  written: done.filter((d) => d.status === 'written').map((d) => d.file),
  blocked: done.filter((d) => d.status === 'blocked'),
  failed: sel.stories.length - done.length,
  skipped: sel.skipped || [],
  merge,
}
