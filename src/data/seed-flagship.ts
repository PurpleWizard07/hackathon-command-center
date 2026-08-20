/* Seed specs, part one: the flagship hackathon with the closest deadline and a
   near-complete submission. */

import type { Spec } from './seed-types'

export const GROUP_1: Spec[] = [
  {
    name: 'Build with Claude',
    platform: 'Devpost',
    prizePool: 50000,
    deadlineInDays: 0,
    deadlineHour: 23,
    deadlineMinute: 59,
    deadlineHoursFromNow: 18,
    registeredDaysAgo: 26,
    status: 'ready',
    projectName: 'Ledgerline',
    description:
      'Flagship agent hackathon. Build a production-grade application on top of Claude that automates a real workflow end to end. Judges weight working software far above pitch polish, and every finalist gets a live technical review.',
    tags: ['Agents', 'Tool use', 'Production'],
    requirements: [
      ['Public GitHub repository', 'MIT or Apache-2.0, with commit history from the hackathon window.', true, true],
      ['Claude API integration', 'Core functionality must be driven by the Claude API, not a thin wrapper.', true, true],
      ['Live deployment', 'A publicly reachable URL judges can use without setup.', true, true],
      ['Demo video', 'Three minutes maximum, unlisted YouTube or Loom.', true, true],
      ['Architecture diagram', 'One diagram showing data flow and agent boundaries.', true, true],
      ['Technical breakdown', 'Explain the agent loop, tool schema and failure handling.', false, true],
    ],
    criteria: [
      ['Technical execution', 'Does the system hold up under real use? Judges will run it themselves.', 35],
      ['Innovation', 'Novel use of tool calling, memory or multi-step reasoning.', 25],
      ['Impact', 'Does it remove genuine, measurable work from a real workflow?', 20],
      ['UX and design', 'Clarity, responsiveness and craft of the interface.', 20],
    ],
    links: [
      ['website', 'Hackathon home', 'https://devpost.com/hackathons'],
      ['rules', 'Official rules', 'https://devpost.com/hackathons'],
      ['discord', 'Participant Discord', 'https://discord.com'],
      ['submission', 'Submission form', 'https://devpost.com'],
      ['docs', 'Claude API docs', 'https://docs.claude.com'],
    ],
    submission: [
      ['text', 'Project name', 'Shown as the title of your submission.', true, 'Ledgerline'],
      [
        'longtext',
        'Project description',
        'What it does, who it is for, and why it matters. 150 words or fewer.',
        true,
        'Ledgerline turns a shared inbox of supplier invoices into a reconciled ledger. A Claude agent reads each attachment, extracts line items, matches them against open purchase orders and files only the exceptions a human actually needs to look at. Finance teams go from four hours of manual matching a day to a twelve-minute review queue.',
      ],
      ['url', 'GitHub repository', 'Public repo with a README.', true, 'https://github.com/varad/ledgerline'],
      ['url', 'Live demo', 'Deployed URL, no login wall.', true, 'https://ledgerline.app'],
      ['url', 'Demo video', 'Three minutes maximum.', true, 'https://youtu.be/ledgerline-demo'],
      ['check', 'Screenshots uploaded', 'At least three, 1280x800 or larger.', true, 'true'],
      ['check', 'README complete', 'Setup, architecture and environment variables documented.', true, 'true'],
      ['url', 'Architecture diagram', 'Link to the exported diagram.', true, 'https://excalidraw.com/ledgerline-arch'],
      [
        'longtext',
        'What are you most proud of?',
        'Optional free-response question from the organisers.',
        false,
        'The exception queue. Getting the agent to say "I am not sure" instead of guessing was harder than making it accurate.',
      ],
    ],
    tasks: [
      ['done', 'urgent', 'Ship exception queue', 'Human review lane for low-confidence matches.', -4],
      ['done', 'high', 'Record demo video', 'Three-minute walkthrough, no dead air.', -1],
      ['done', 'high', 'Write README', 'Setup, architecture, environment variables.', -2],
      ['done', 'medium', 'Export architecture diagram', 'Excalidraw, dark background.', -2],
      ['in_progress', 'urgent', 'Final submission read-through', 'Check every field once more before locking it in.', 0],
      ['todo', 'medium', 'Post in Discord showcase', 'Optional, but organisers boost visibility.', 0],
    ],
    assets: [
      ['repo', 'ledgerline', 'https://github.com/varad/ledgerline', 'Monorepo: web, worker, agent.'],
      ['demo', 'Live deployment', 'https://ledgerline.app', 'Seeded demo tenant, no login required.'],
      ['video', 'Demo walkthrough', 'https://youtu.be/ledgerline-demo', 'Final cut, 2:48.', '2:48'],
      ['diagram', 'Architecture diagram', 'https://excalidraw.com/ledgerline-arch', 'Agent loop and tool boundaries.'],
      ['document', 'README.md', 'README.md', 'Setup and architecture notes.', '11 KB'],
      ['image', 'Exception queue', 'screenshots/exception-queue.png', 'Primary hero screenshot.', '1.4 MB'],
      ['image', 'Reconciliation view', 'screenshots/reconciliation.png', 'Secondary screenshot.', '980 KB'],
      ['document', 'Pitch notes', 'docs/pitch.md', 'Talking points for the judging call.', '4 KB'],
    ],
  },
]
