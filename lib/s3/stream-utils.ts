/** AWS SDK v3 GetObject body → Buffer */
export async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(body)) {
    return body
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body)
  }
  const stream = body as AsyncIterable<Uint8Array> | NodeJS.ReadableStream
  const chunks: Buffer[] = []
  if (Symbol.asyncIterator in Object(stream as object)) {
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk))
    }
  } else {
    return new Promise((resolve, reject) => {
      const r = stream as NodeJS.ReadableStream
      r.on('data', (c: Buffer) => chunks.push(Buffer.from(c)))
      r.on('end', () => resolve(Buffer.concat(chunks)))
      r.on('error', reject)
    })
  }
  return Buffer.concat(chunks)
}
