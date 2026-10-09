import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin, type ResolvedConfig } from 'vite'

/**
 * Production-only Content Security Policy. Scripts may only come from this
 * origin; network calls only to Supabase and the geocoder. (Dev mode is exempt
 * because Vite injects inline scripts for hot reload.)
 */
function csp(supabaseUrl: string | undefined): Plugin {
  let origin = 'https://*.supabase.co'
  try {
    if (supabaseUrl) origin = new URL(supabaseUrl).origin
  } catch {
    // keep the wildcard default
  }
  const ws = origin.replace(/^https:/, 'wss:')
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://*.googleusercontent.com",
    "font-src 'self'",
    `connect-src 'self' ${origin} ${ws} https://geocoding-api.open-meteo.com`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-src 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
  let outDir = 'dist'
  return {
    name: 'astrolife-csp',
    apply: 'build',
    configResolved: (c: ResolvedConfig) => { outDir = join(c.root, c.build.outDir) },
    transformIndexHtml: (html) =>
      html.replace('<!--CSP-->', `<meta http-equiv="Content-Security-Policy" content="${policy}" />`),
    // Also send the policy as a real header (with frame-ancestors, which a meta tag ignores).
    closeBundle() {
      const file = join(outDir, '_headers')
      try {
        const headers = readFileSync(file, 'utf8')
        writeFileSync(file, headers.replace("Content-Security-Policy: frame-ancestors 'none'", `Content-Security-Policy: ${policy}; frame-ancestors 'none'`))
      } catch {
        // No _headers file: the meta tag still applies.
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE || '/'
  return {
    base,
    plugins: [react(), csp(env.VITE_SUPABASE_URL)],
    // Never inline fonts as data: URIs; the CSP only allows fonts from this origin.
    build: { sourcemap: false, chunkSizeWarningLimit: 1200, assetsInlineLimit: (file: string) => (/\.(woff2?|ttf)$/.test(file) ? false : undefined) },
  }
})
