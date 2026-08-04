import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter'
import './index.css'

// Polyfill crypto.subtle para contextos HTTP (rede interna sem HTTPS).
async function ensureCryptoSubtle() {
  if (window.crypto?.subtle) return;
  const { sha256 } = await import('@noble/hashes/sha2.js');
  const mockSubtle = {
    async digest(_alg: AlgorithmIdentifier, data: ArrayBuffer | ArrayBufferView): Promise<ArrayBuffer> {
      const bytes = data instanceof ArrayBuffer
        ? new Uint8Array(data)
        : new Uint8Array(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
      return sha256(bytes).buffer as ArrayBuffer;
    },
  } as unknown as SubtleCrypto;
  try {
    Object.defineProperty(window.crypto, 'subtle', { value: mockSubtle, configurable: true });
  } catch {
    const orig = window.crypto;
    const proxy = new Proxy(orig, {
      get(t, p) {
        if (p === 'subtle') return mockSubtle;
        const v = (t as unknown as Record<string | symbol, unknown>)[p as string];
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v;
      },
    });
    Object.defineProperty(window, 'crypto', { value: proxy, configurable: true });
  }
}

async function bootstrap() {
  await ensureCryptoSubtle();

  const { default: keycloak } = await import('./keycloak')
  const { router }             = await import('./router')
  const { RouterProvider }     = await import('react-router-dom')

  await keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false,
  })

  const root = createRoot(document.getElementById('root')!)
  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}

bootstrap()
