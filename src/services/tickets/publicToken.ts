const tokenBytes = 32;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createPublicToken() {
  const cryptoApi = globalThis.crypto;

  if (!cryptoApi?.getRandomValues) {
    throw new Error('Nao foi possivel gerar um token publico seguro.');
  }

  const bytes = new Uint8Array(tokenBytes);
  cryptoApi.getRandomValues(bytes);

  return bytesToHex(bytes);
}
