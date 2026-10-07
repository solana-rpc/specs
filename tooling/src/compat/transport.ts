import WebSocket from 'ws'

export class TransportError extends Error {}
export class ProtocolError extends Error {}
export type Call = (method: string, params: unknown[]) => Promise<unknown>

export interface TransportOptions {
  timeout: number
  maxBytes: number
  headers?: Record<string, string>
}

export function envelope(value: any, id: number): any {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.jsonrpc !== '2.0' || value.id !== id) {
    throw new ProtocolError('Response must contain jsonrpc: "2.0" and the matching request id')
  }
  if (Object.hasOwn(value, 'result') === Object.hasOwn(value, 'error')) {
    throw new ProtocolError('Response must contain exactly one of result or error')
  }
  if (Object.hasOwn(value, 'error') && (!value.error || !Number.isInteger(value.error.code) || typeof value.error.message !== 'string')) {
    throw new ProtocolError('Error must contain an integer code and a string message')
  }
  return value
}

export function httpTransport(endpoint: string, options: TransportOptions): Call {
  let id = 0
  return async (method, params) => {
    const requestId = ++id
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), options.timeout)
    try {
      const response = await fetch(endpoint, {
        method: 'POST', redirect: 'error', signal: controller.signal,
        headers: { ...options.headers, 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: requestId, method, params }),
      })
      if (!response.ok) {
        await response.body?.cancel()
        throw new TransportError(`HTTP ${response.status}`)
      }
      const reader = response.body?.getReader()
      if (!reader) throw new ProtocolError('Empty HTTP body')
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.length
        if (size > options.maxBytes) {
          await reader.cancel()
          throw new TransportError('Response exceeds configured byte limit')
        }
        chunks.push(value)
      }
      let json: unknown
      try { json = JSON.parse(Buffer.concat(chunks).toString('utf8')) }
      catch { throw new ProtocolError('Response is not valid JSON') }
      return envelope(json, requestId)
    } catch (error) {
      if (error instanceof ProtocolError || error instanceof TransportError) throw error
      throw new TransportError(controller.signal.aborted ? 'Request timed out' : 'HTTP connection failed')
    } finally { clearTimeout(timer) }
  }
}

export class SocketTransport {
  private id = 0
  private pending = new Map<number, { resolve: (v: unknown) => void, reject: (e: Error) => void }>()
  private notifications: unknown[] = []
  private fault?: Error
  private socket: WebSocket

  constructor(endpoint: string, private options: TransportOptions) {
    this.socket = new WebSocket(endpoint, { headers: options.headers, maxPayload: options.maxBytes, handshakeTimeout: options.timeout, followRedirects: false })
    this.socket.on('error', () => this.fail(new TransportError('WebSocket connection failed')))
    this.socket.on('close', () => this.fail(new TransportError('WebSocket closed')))
    this.socket.on('message', (data) => {
      let value: any
      try { value = JSON.parse(data.toString()) }
      catch { this.fail(new ProtocolError('WebSocket message is not valid JSON')); return }
      if (value && Object.hasOwn(value, 'id')) {
        const pending = this.pending.get(value.id)
        if (!pending) { this.fail(new ProtocolError('Unexpected WebSocket response id')); return }
        this.pending.delete(value.id)
        try { pending.resolve(envelope(value, value.id)) }
        catch (error) { pending.reject(error as Error) }
      } else {
        if (this.notifications.length >= 1000) {
          this.fail(new TransportError('WebSocket notification buffer limit reached'))
        } else this.notifications.push(value)
      }
    })
  }

  private fail(error: Error) {
    this.fault ??= error
    for (const pending of this.pending.values()) pending.reject(error)
    this.pending.clear()
  }

  async open() {
    if (this.fault) throw this.fault
    if (this.socket.readyState === WebSocket.OPEN) return
    await new Promise<void>((resolve, reject) => {
      const opened = () => { cleanup(); resolve() }
      const failed = () => { cleanup(); reject(this.fault ?? new TransportError('WebSocket connection failed')) }
      const cleanup = () => {
        this.socket.off('open', opened)
        this.socket.off('error', failed)
        this.socket.off('close', failed)
      }
      this.socket.once('open', opened)
      this.socket.once('error', failed)
      this.socket.once('close', failed)
    })
  }

  call: Call = async (method, params) => {
    if (this.fault) throw this.fault
    const id = ++this.id
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new TransportError('WebSocket request timed out'))
      }, this.options.timeout)
      this.pending.set(id, {
        resolve: (value) => { clearTimeout(timer); resolve(value) },
        reject: (error) => { clearTimeout(timer); reject(error) },
      })
      this.socket.send(JSON.stringify({ jsonrpc: '2.0', id, method, params }), (error) => {
        if (error) this.fail(new TransportError('WebSocket send failed'))
      })
    })
  }

  async observe(duration: number): Promise<unknown[]> {
    const until = Date.now() + duration
    while (Date.now() < until) {
      if (this.fault) throw this.fault
      await new Promise((resolve) => setTimeout(resolve, Math.min(50, until - Date.now())))
    }
    if (this.fault) throw this.fault
    return this.notifications.splice(0)
  }

  close() { this.socket.terminate() }
}
