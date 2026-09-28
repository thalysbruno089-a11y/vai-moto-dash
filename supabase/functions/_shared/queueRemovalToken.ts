const encoder = new TextEncoder()
const tokenLifetimeMs = 24 * 60 * 60 * 1000

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function createQueueRemovalToken(entryId: string, secret: string, now = Date.now()): Promise<string> {
  const payload = encodeBase64Url(encoder.encode(`${entryId}.${now + tokenLifetimeMs}`))
  const signature = await crypto.subtle.sign('HMAC', await getSigningKey(secret), encoder.encode(payload))
  return `${payload}.${encodeBase64Url(new Uint8Array(signature))}`
}

export async function verifyQueueRemovalToken(token: string, secret: string, now = Date.now()): Promise<string | null> {
  try {
    const [payload, encodedSignature, extra] = token.split('.')
    if (!payload || !encodedSignature || extra) return null

    const signatureValid = await crypto.subtle.verify(
      'HMAC',
      await getSigningKey(secret),
      decodeBase64Url(encodedSignature),
      encoder.encode(payload),
    )
    if (!signatureValid) return null

    const decodedPayload = new TextDecoder().decode(decodeBase64Url(payload))
    const [entryId, expiration, extraPayload] = decodedPayload.split('.')
    if (extraPayload || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entryId ?? '')) return null
    if (!expiration || !Number.isFinite(Number(expiration)) || Number(expiration) <= now) return null

    return entryId
  } catch {
    return null
  }
}