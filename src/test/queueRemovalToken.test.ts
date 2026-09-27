import { describe, expect, it } from 'vitest'
import { createQueueRemovalToken, verifyQueueRemovalToken } from '../../supabase/functions/_shared/queueRemovalToken'

const entryId = '4c9e7c40-bfc5-4b62-9b64-cb09cdab35bd'
const secret = 'test-service-role-secret'

describe('queue removal token', () => {
  it('verifies a token for its queue entry', async () => {
    const token = await createQueueRemovalToken(entryId, secret, 1000)

    await expect(verifyQueueRemovalToken(token, secret, 2000)).resolves.toBe(entryId)
  })

  it('rejects tampered and expired tokens', async () => {
    const token = await createQueueRemovalToken(entryId, secret, 1000)
    const [payload, signature] = token.split('.')

    await expect(verifyQueueRemovalToken(`${payload}.${signature.slice(0, -1)}x`, secret, 2000)).resolves.toBeNull()
    await expect(verifyQueueRemovalToken(token, secret, 24 * 60 * 60 * 1000 + 1000)).resolves.toBeNull()
  })
})