import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import type { Asset, AssetType, HackathonBundle } from '@/types'
import { useStore } from '@/store/StoreProvider'
import { assetGroup } from '@/lib/derive'
import { isValidUrl, prettyUrl } from '@/lib/format'
import { formatDate } from '@/lib/time'
import {
  Badge,
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Field,
  Input,
  Segmented,
  Select,
  Textarea,
} from '@/components/ui'
import {
  IconDiagram,
  IconDoc,
  IconImage,
  IconLink,
  IconPencil,
  IconPlus,
  IconRepo,
  IconRocket,
  IconTrash,
  IconUpload,
  IconVideo,
} from '@/components/icons'

const TYPE_LABEL: Record<AssetType, string> = {
  link: 'Link',
  repo: 'Repository',
  demo: 'Live demo',
  image: 'Image',
  video: 'Video',
  document: 'Document',
  diagram: 'Diagram',
  file: 'File',
}

const TYPE_ICON: Record<AssetType, typeof IconLink> = {
  link: IconLink,
  repo: IconRepo,
  demo: IconRocket,
  image: IconImage,
  video: IconVideo,
  document: IconDoc,
  diagram: IconDiagram,
  file: IconUpload,
}

const GROUP_LABEL = {
  all: 'All',
  links: 'Links',
  media: 'Media',
  docs: 'Documents',
  files: 'Files',
} as const

type GroupKey = keyof typeof GROUP_LABEL

export function Assets() {
  const bundle = useOutletContext<HackathonBundle>()
  const { dispatch } = useStore()
  const [group, setGroup] = useState<GroupKey>('all')
  const [editing, setEditing] = useState<Asset | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Asset | null>(null)

  const counts = useMemo(() => {
    const base: Record<GroupKey, number> = { all: bundle.assets.length, links: 0, media: 0, docs: 0, files: 0 }
    for (const asset of bundle.assets) base[assetGroup(asset.type)] += 1
    return base
  }, [bundle.assets])

  const visible = useMemo(
    () =>
      bundle.assets
        .filter((asset) => group === 'all' || assetGroup(asset.type) === group)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [bundle.assets, group],
  )

  return (
    <>
      <div className="toolbar" style={{ marginTop: 0 }}>
        <Segmented
          label="Filter assets"
          value={group}
          onChange={setGroup}
          options={(Object.keys(GROUP_LABEL) as GroupKey[])
            .filter((key) => key === 'all' || counts[key] > 0)
            .map((key) => ({ value: key, label: GROUP_LABEL[key], count: counts[key] }))}
        />
        <Button variant="primary" onClick={() => setCreating(true)}>
          <IconPlus style={{ width: 14, height: 14 }} />
          Add asset
        </Button>
      </div>

      {bundle.assets.length === 0 ? (
        <EmptyState
          title="The vault is empty."
          body="Keep the repo, demo link, screenshots, diagram and pitch doc together here so submission day is copy-and-paste."
          action={
            <Button variant="primary" onClick={() => setCreating(true)}>
              Add your first asset
            </Button>
          }
        />
      ) : (
        <div className="asset-grid">
          {visible.map((asset) => {
            const Glyph = TYPE_ICON[asset.type]
            const kind = assetGroup(asset.type)
            const external = isValidUrl(asset.url)
            return (
              <article className="acard" key={asset.id}>
                <div className="acard__top">
                  <span className={`acard__icon acard__icon--${kind}`}>
                    <Glyph />
                  </span>
                  <div className="acard__body">
                    <h4 className="acard__name">{asset.name}</h4>
                    <p className="acard__where">
                      {external ? prettyUrl(asset.url) : asset.url || 'No location set'}
                    </p>
                  </div>
                </div>

                {asset.note && <p className="acard__note">{asset.note}</p>}

                <div className="acard__foot">
                  <div className="inline-actions">
                    <Badge>{TYPE_LABEL[asset.type]}</Badge>
                    {asset.meta && <span className="acard__where">{asset.meta}</span>}
                  </div>
                  <div className="inline-actions">
                    <span className="acard__where">{formatDate(asset.createdAt)}</span>
                    {external && (
                      <a
                        className="icon-btn"
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`Open ${asset.name}`}
                      >
                        <IconRocket />
                      </a>
                    )}
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Edit ${asset.name}`}
                      onClick={() => setEditing(asset)}
                    >
                      <IconPencil />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn--danger"
                      aria-label={`Delete ${asset.name}`}
                      onClick={() => setDeleting(asset)}
                    >
                      <IconTrash />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <AssetDialog
        open={creating || editing !== null}
        asset={editing}
        hackathonId={bundle.hackathon.id}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && dispatch({ type: 'asset/remove', id: deleting.id })}
        title={`Delete ${deleting?.name ?? 'asset'}?`}
        body="This removes the entry from your vault. The underlying file or link is untouched."
      />
    </>
  )
}

function AssetDialog({
  open,
  asset,
  hackathonId,
  onClose,
}: {
  open: boolean
  asset: Asset | null
  hackathonId: string
  onClose: () => void
}) {
  const { dispatch } = useStore()
  const [name, setName] = useState('')
  const [type, setType] = useState<AssetType>('link')
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [key, setKey] = useState('')

  const identity = `${open}:${asset?.id ?? 'new'}`
  if (identity !== key) {
    setKey(identity)
    setName(asset?.name ?? '')
    setType(asset?.type ?? 'link')
    setUrl(asset?.url ?? '')
    setNote(asset?.note ?? '')
    setError('')
  }

  const save = () => {
    if (!name.trim()) {
      setError('A name is required.')
      return
    }
    const patch = { name: name.trim(), type, url: url.trim(), note: note.trim() }
    if (asset) dispatch({ type: 'asset/update', id: asset.id, patch })
    else dispatch({ type: 'asset/add', hackathonId, patch })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={asset ? 'Edit asset' : 'Add asset'}
      description="Links open in a new tab. Files can be recorded by path so you always know where they live."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>
            {asset ? 'Save' : 'Add asset'}
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field label="Name" htmlFor="asset-name" error={error}>
          <Input
            id="asset-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            placeholder="Demo walkthrough"
            autoComplete="off"
          />
        </Field>
        <Field label="Type" htmlFor="asset-type">
          <Select
            id="asset-type"
            value={type}
            onChange={(e) => setType(e.target.value as AssetType)}
          >
            {(Object.keys(TYPE_LABEL) as AssetType[]).map((value) => (
              <option key={value} value={value}>
                {TYPE_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Location"
          htmlFor="asset-url"
          hint="A full URL, or a path like screenshots/hero.png"
          span
        >
          <Input
            id="asset-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/you/project"
            autoComplete="off"
          />
        </Field>
        <Field label="Note" htmlFor="asset-note" span>
          <Textarea
            id="asset-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What this is for."
          />
        </Field>
      </div>
    </Dialog>
  )
}
