// Resolves where each part of an intake submission lands inside a client folder.
//
// The folder names below must match June's scaffold exactly (see
// TEMPLATE_SUBFOLDERS in ~/.hermes/scripts/soraia_fulfillment_common.py) — em
// dashes and all. A near-miss silently creates a second, wrong folder rather than
// failing, so these strings are load-bearing.
import { driveFetch, ensureFolder } from './drive.js'

export const FOLDER = {
  INSPIRATION: 'Inspiration & Moodboards',
  PHOTOS_BEFORE: 'Photos — Before',
  FLOOR_PLANS: 'Floor Plans & Measurements',
  BRIEF: 'Brief & Scope',
  UPLOADS: 'Client Uploads',
}

// Which upload question routes where. This mapping is the entire reason the new
// form beats the old one: today everything lands in one undifferentiated "Client
// Uploads" bucket, which is why Frank has 56 untriaged IMG_*.HEIC walkthrough
// shots and Martin has floor plans and a .dwg sitting in his. Asking separately
// files them correctly at submit time, and the triage step stops existing.
export const UPLOAD_ROUTES = {
  inspiration: FOLDER.INSPIRATION,
  property_photos: FOLDER.PHOTOS_BEFORE,
  floor_plans: FOLDER.FLOOR_PLANS,
}

export function isValidUploadKind(kind) {
  return Object.prototype.hasOwnProperty.call(UPLOAD_ROUTES, kind)
}

/**
 * Confirm the signed folder id still points at a real, writable folder.
 *
 * Worth doing even though the id came from a signed token: folders get renamed,
 * trashed, or moved by hand between the link being minted and the client opening
 * it. Failing here with a clear reason beats uploading into a trashed folder.
 */
export async function assertClientFolder(folderId) {
  const f = await driveFetch(`/files/${folderId}`, {
    params: { fields: 'id,name,mimeType,trashed,capabilities/canAddChildren', supportsAllDrives: true },
  })
  if (f.mimeType !== 'application/vnd.google-apps.folder') {
    throw new Error(`Intake target ${folderId} is not a folder`)
  }
  if (f.trashed) throw new Error(`Intake target folder "${f.name}" is in the trash`)
  if (!f.capabilities?.canAddChildren) {
    throw new Error(`No write access to intake target folder "${f.name}"`)
  }
  return { id: f.id, name: f.name }
}

/**
 * Folder id for one upload kind, creating the subfolder if it is missing.
 *
 * Creating rather than erroring is deliberate. Folders adopted by hand rather than
 * scaffolded can be missing pieces of the template — as of 2026-08-04 Frank Sarlo's
 * client folder had no "Inspiration & Moodboards" at all. Refusing the upload would
 * punish the client for our filing gap; ensureFolder is idempotent, so this quietly
 * repairs the tree on first use.
 */
export async function resolveUploadTarget(rootFolderId, kind) {
  const name = UPLOAD_ROUTES[kind]
  if (!name) throw new Error(`Unknown upload kind: ${kind}`)
  const folder = await ensureFolder(name, rootFolderId)
  return { id: folder.id, name, created: folder.created }
}

/** Folder id for the written design brief. */
export async function resolveBriefTarget(rootFolderId) {
  const folder = await ensureFolder(FOLDER.BRIEF, rootFolderId)
  return { id: folder.id, name: FOLDER.BRIEF, created: folder.created }
}
