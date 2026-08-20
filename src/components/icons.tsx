/* A small hand-rolled icon set: 14 line icons, no icon-library dependency. */

import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement>

function Icon({ children, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export const IconOverview = (p: Props) => (
  <Icon {...p}>
    <rect x="2.25" y="2.25" width="5" height="5" rx="1.2" />
    <rect x="8.75" y="2.25" width="5" height="5" rx="1.2" />
    <rect x="2.25" y="8.75" width="5" height="5" rx="1.2" />
    <rect x="8.75" y="8.75" width="5" height="5" rx="1.2" />
  </Icon>
)

export const IconSubmission = (p: Props) => (
  <Icon {...p}>
    <path d="M4 2.5h5.5L12.5 5.5V13a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5Z" />
    <path d="M9.25 2.75V5.5h2.9" />
    <path d="M5.75 9.25l1.3 1.3 2.6-2.6" />
  </Icon>
)

export const IconTasks = (p: Props) => (
  <Icon {...p}>
    <path d="M2.5 4.25h3.25M2.5 8h3.25M2.5 11.75h3.25" />
    <path d="M8.25 4.25h5.25M8.25 8h5.25M8.25 11.75h5.25" opacity="0.5" />
  </Icon>
)

export const IconAssets = (p: Props) => (
  <Icon {...p}>
    <path d="M2.5 5.25V4a.5.5 0 0 1 .5-.5h2.6l1.2 1.5h5.7a.5.5 0 0 1 .5.5v6.5a.5.5 0 0 1-.5.5H3a.5.5 0 0 1-.5-.5V5.25Z" />
  </Icon>
)

export const IconSettings = (p: Props) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="2" />
    <path d="M8 1.75v1.6M8 12.65v1.6M2.75 8h1.6M11.65 8h1.6M4.28 4.28l1.13 1.13M10.59 10.59l1.13 1.13M11.72 4.28l-1.13 1.13M5.41 10.59l-1.13 1.13" />
  </Icon>
)

export const IconArrowLeft = (p: Props) => (
  <Icon {...p}>
    <path d="M9.5 3.5 5 8l4.5 4.5" />
  </Icon>
)

export const IconArrowUpRight = (p: Props) => (
  <Icon {...p}>
    <path d="M5 11 11 5M6 5h5v5" />
  </Icon>
)

export const IconPlus = (p: Props) => (
  <Icon {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Icon>
)

export const IconTrash = (p: Props) => (
  <Icon {...p}>
    <path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.2a.6.6 0 0 0 .6.55h4.6a.6.6 0 0 0 .6-.55l.6-8.2" />
  </Icon>
)

export const IconPencil = (p: Props) => (
  <Icon {...p}>
    <path d="M10.6 2.9l2.5 2.5-7.4 7.4-3.2.7.7-3.2 7.4-7.4Z" />
  </Icon>
)

export const IconGlobe = (p: Props) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M2.6 8h10.8M8 2.5c1.5 1.6 2.2 3.5 2.2 5.5S9.5 12 8 13.5C6.5 11.9 5.8 10 5.8 8S6.5 4.1 8 2.5Z" />
  </Icon>
)

export const IconBook = (p: Props) => (
  <Icon {...p}>
    <path d="M3 3.5h4a1.5 1.5 0 0 1 1.5 1.5v8A1.2 1.2 0 0 0 7.3 12H3V3.5Z" />
    <path d="M13 3.5H9a1.5 1.5 0 0 0-1.5 1.5v8A1.2 1.2 0 0 1 8.7 12H13V3.5Z" />
  </Icon>
)

export const IconChat = (p: Props) => (
  <Icon {...p}>
    <path d="M13.5 8.5a4.5 4.5 0 0 1-4.5 4.5H6l-3 2v-2.6A4.5 4.5 0 0 1 2.5 8.5v-1A4.5 4.5 0 0 1 7 3h2a4.5 4.5 0 0 1 4.5 4.5v1Z" />
  </Icon>
)

export const IconScale = (p: Props) => (
  <Icon {...p}>
    <path d="M8 2.5v11M4 5.5l-2 4.2h4L4 5.5ZM12 5.5l-2 4.2h4L12 5.5ZM4.5 4.9 8 4l3.5.9" />
  </Icon>
)

export const IconUpload = (p: Props) => (
  <Icon {...p}>
    <path d="M8 10.5V3.5M5.25 6.25 8 3.5l2.75 2.75M3 11.5v1a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5v-1" />
  </Icon>
)

export const IconImage = (p: Props) => (
  <Icon {...p}>
    <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" />
    <circle cx="6" cy="6.75" r="1" />
    <path d="M3 11l3-2.6 2.4 2 2-1.6 2.6 2.2" />
  </Icon>
)

export const IconVideo = (p: Props) => (
  <Icon {...p}>
    <rect x="2.5" y="3.75" width="11" height="8.5" rx="1.5" />
    <path d="M6.75 6.5 10 8l-3.25 1.5v-3Z" fill="currentColor" stroke="none" />
  </Icon>
)

export const IconDoc = (p: Props) => (
  <Icon {...p}>
    <path d="M4 2.5h5.5L12.5 5.5V13a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5Z" />
    <path d="M9.25 2.75V5.5h2.9M5.75 8.5h4.5M5.75 10.75h3" />
  </Icon>
)

export const IconDiagram = (p: Props) => (
  <Icon {...p}>
    <rect x="5.75" y="2" width="4.5" height="3" rx="0.8" />
    <rect x="2" y="11" width="4" height="3" rx="0.8" />
    <rect x="10" y="11" width="4" height="3" rx="0.8" />
    <path d="M8 5v3M4 11V8.5h8V11" />
  </Icon>
)

export const IconRepo = (p: Props) => (
  <Icon {...p}>
    <path d="M3.5 2.5h7a1 1 0 0 1 1 1v10l-3-1.6-3 1.6V3.5a1 1 0 0 1 1-1Z" />
    <path d="M11.5 5.5h1" />
  </Icon>
)

export const IconLink = (p: Props) => (
  <Icon {...p}>
    <path d="M6.6 9.4 9.4 6.6M7.2 4.6 8.5 3.3a2.4 2.4 0 0 1 3.4 3.4l-1.3 1.3M8.8 11.4l-1.3 1.3a2.4 2.4 0 0 1-3.4-3.4l1.3-1.3" />
  </Icon>
)

export const IconRocket = (p: Props) => (
  <Icon {...p}>
    <path d="M6.5 9.5 4 9l1-2.5c1.5-3 4.3-4.3 7.5-4 .3 3.2-1 6-4 7.5L6 11l-.5-1.5Z" />
    <circle cx="9.6" cy="6.4" r="1" />
    <path d="M5.5 10.5 3.5 12.5" />
  </Icon>
)

export const IconClock = (p: Props) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M8 5v3.2l2.2 1.3" />
  </Icon>
)

export const IconSearch = (p: Props) => (
  <Icon {...p}>
    <circle cx="7.25" cy="7.25" r="4.25" />
    <path d="M10.5 10.5 13.5 13.5" />
  </Icon>
)
