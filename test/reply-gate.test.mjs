// Reply gate: does the sequencer notice a lead who replied?
//   node --test test/
//
// The failure this guards against is not theoretical. Eve Alpern's intake address
// was hello@saltystaysmaine.com; she replied twice on 2026-08-06 from
// evealpern@gmail.com asking to book a follow-up. The old gate only searched
// `from:<intake address>`, saw nothing, left her `active` at email_4_math, and
// had the "last note, I'll stop bugging you" email queued at her.
//
// Every wrong answer here mails somebody who should not be mailed, so the cases
// below are all "would this have caught Eve" or "would this park a live lead".

import test from 'node:test'
import assert from 'node:assert/strict'

import { __test } from '../api/_lib/gmail.js'

const { isOurDomain, inboundOnOurThreads } = __test
const DAY = 86_400_000

// Minimal Gmail stub. `threads` maps a thread id to the From headers on it.
function stubGmail({ threadIds = [], threads = {} }) {
  const calls = []
  return {
    calls,
    fetch: async (url) => {
      calls.push(url)
      const path = String(url)
      if (path.includes('/threads?')) {
        return okJson({ threads: threadIds.map((id) => ({ id })) })
      }
      const id = path.match(/threads\/([^?]+)/)?.[1]
      const msgs = (threads[id] || []).map(({ from, ageDays = 0 }) => ({
        internalDate: String(Date.now() - ageDays * DAY),
        payload: { headers: [{ name: 'From', value: from }] },
      }))
      return okJson({ messages: msgs })
    },
  }
}

const okJson = (body) => ({ ok: true, json: async () => body })

async function withStub(stub, fn) {
  const real = globalThis.fetch
  globalThis.fetch = stub.fetch
  try {
    return await fn()
  } finally {
    globalThis.fetch = real
  }
}

test('our own team is not a lead reply', () => {
  assert.equal(isOurDomain('abe@soraiadesigns.com'), true)
  assert.equal(isOurDomain('Soraia <soraia@soraiadesigns.com>'.replace(/.*<|>/g, '')), true)
  assert.equal(isOurDomain('lis@soraiadesigns.com'), true)
  assert.equal(isOurDomain('evealpern@gmail.com'), false)
  assert.equal(isOurDomain('hello@saltystaysmaine.com'), false)
})

// THE EVE CASE. Reply arrives on our thread from an address we have never seen.
test('catches a reply sent from a different address than the one on file', async () => {
  const stub = stubGmail({
    threadIds: ['t1'],
    threads: {
      t1: [
        { from: 'Abe Heisler <abe@soraiadesigns.com>', ageDays: 9 },
        { from: 'Eve Alpern <evealpern@gmail.com>', ageDays: 1 },
      ],
    },
  })
  const hit = await withStub(stub, () =>
    inboundOnOurThreads('tok', 'hello@saltystaysmaine.com', 60, Date.now() - 60 * DAY)
  )
  assert.equal(hit, true, 'a reply from an alternate address must stop the ladder')
})

// The inverse mistake: parking a live lead because Abe looped in his own team.
test('does not treat our own team on the thread as a reply', async () => {
  const stub = stubGmail({
    threadIds: ['t1'],
    threads: {
      t1: [
        { from: 'Abe Heisler <abe@soraiadesigns.com>', ageDays: 5 },
        { from: 'Soraia <soraia@soraiadesigns.com>', ageDays: 4 },
        { from: 'Lis <lis@soraiadesigns.com>', ageDays: 3 },
      ],
    },
  })
  const hit = await withStub(stub, () =>
    inboundOnOurThreads('tok', 'lead@example.com', 60, Date.now() - 60 * DAY)
  )
  assert.equal(hit, false, 'internal chatter must not park a live lead')
})

// Protects the re-engage release path: a lead is parked BECAUSE they wrote "not
// now", so counting that original reply would suppress the release send forever.
test('ignores replies older than the lookback window', async () => {
  const stub = stubGmail({
    threadIds: ['t1'],
    threads: {
      t1: [
        { from: 'Abe Heisler <abe@soraiadesigns.com>', ageDays: 120 },
        { from: 'lead@example.com', ageDays: 100 },
      ],
    },
  })
  const hit = await withStub(stub, () =>
    inboundOnOurThreads('tok', 'lead@example.com', 7, Date.now() - 7 * DAY)
  )
  assert.equal(hit, false, 'a reply before the release date is not new engagement')
})

test('a thread with only our sends is not a reply', async () => {
  const stub = stubGmail({
    threadIds: ['t1'],
    threads: { t1: [{ from: 'Abe Heisler <abe@soraiadesigns.com>', ageDays: 2 }] },
  })
  const hit = await withStub(stub, () =>
    inboundOnOurThreads('tok', 'lead@example.com', 60, Date.now() - 60 * DAY)
  )
  assert.equal(hit, false)
})

test('thread scan is bounded', async () => {
  const ids = Array.from({ length: 50 }, (_, i) => `t${i}`)
  const stub = stubGmail({ threadIds: ids, threads: {} })
  await withStub(stub, () =>
    inboundOnOurThreads('tok', 'lead@example.com', 60, Date.now() - 60 * DAY)
  )
  const listUrl = stub.calls.find((u) => u.includes('/threads?'))
  assert.match(listUrl, /maxResults=10/, 'must cap how many threads it walks')
})
