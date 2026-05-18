function requireDriveEnv() {
  const missing = ['GOOGLE_DRIVE_CLIENT_ID', 'GOOGLE_DRIVE_CLIENT_SECRET', 'GOOGLE_DRIVE_REFRESH_TOKEN', 'GOOGLE_DRIVE_AUDIT_PROSPECTS_FOLDER_ID']
    .filter((key) => !process.env[key])
  if (missing.length) {
    throw new Error(`Missing Drive env: ${missing.join(', ')}`)
  }
  return {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
    prospectsFolderId: process.env.GOOGLE_DRIVE_AUDIT_PROSPECTS_FOLDER_ID,
  }
}

async function getAccessToken() {
  const { clientId, clientSecret, refreshToken } = requireDriveEnv()
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive token refresh failed ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.access_token
}

async function driveFetch(path, { method = 'GET', body, params } = {}) {
  const token = await getAccessToken()
  const url = new URL(`https://www.googleapis.com/drive/v3${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value != null && value !== '') url.searchParams.set(key, String(value))
    })
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive ${method} ${path} failed ${res.status}: ${text}`)
  }

  return res.status === 204 ? null : res.json()
}

function folderQuery(name, parentId) {
  const escaped = String(name).replace(/'/g, "\\'")
  return `name = '${escaped}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`
}

async function findFolderByName(name, parentId) {
  const data = await driveFetch('/files', {
    params: {
      q: folderQuery(name, parentId),
      fields: 'files(id,name,webViewLink,parents)',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    },
  })
  return data.files?.[0] || null
}

async function ensureFolder(name, parentId) {
  const existing = await findFolderByName(name, parentId)
  if (existing) return { ...existing, created: false }

  const created = await driveFetch('/files', {
    method: 'POST',
    params: {
      fields: 'id,name,webViewLink,parents',
      supportsAllDrives: true,
    },
    body: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
  })
  return { ...created, created: true }
}

function cleanPart(value) {
  return String(value || '')
    .replace(/[\n\r]+/g, ' ')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function buildProspectFolderName(payload) {
  const name = cleanPart(payload.full_name || 'Unknown Prospect')
  const city = cleanPart(payload.property_city)
  const state = cleanPart(payload.property_state)
  return [name, [city, state].filter(Boolean).join(', ')].filter(Boolean).join(' — ')
}

export async function ensureAuditProspectDriveStructure(payload) {
  const { prospectsFolderId } = requireDriveEnv()
  const prospectFolder = await ensureFolder(buildProspectFolderName(payload), prospectsFolderId)

  const subfolderNames = [
    '01 Audit Report',
    '02 Intake + Notes',
    '03 Images + Screenshots',
    '04 Proposal / Scope',
    '05 Follow-Up',
  ]

  const subfolders = {}
  for (const name of subfolderNames) {
    const folder = await ensureFolder(name, prospectFolder.id)
    subfolders[name] = {
      id: folder.id,
      url: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
      created: folder.created,
    }
  }

  return {
    id: prospectFolder.id,
    name: prospectFolder.name,
    url: prospectFolder.webViewLink || `https://drive.google.com/drive/folders/${prospectFolder.id}`,
    created: prospectFolder.created,
    subfolders,
  }
}
