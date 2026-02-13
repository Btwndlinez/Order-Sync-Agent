#!/usr/bin/env node

/**
 * Build Script for OrderSync Chrome Extension
 * Creates browser-ready dist/ folder with bundled assets
 */

import { build } from 'esbuild'
import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

const isProduction = process.env.NODE_ENV === 'production'

console.log('🚀 Building OrderSync Extension...')
console.log(`Mode: ${isProduction ? 'Production' : 'Development'}`)

// Ensure dist directory exists
const distDir = 'dist'
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true })
}

// Content Script Build
build({
  entryPoints: ['extension/content.ts'],
  bundle: true,
  outfile: 'dist/content.js',
  format: 'iife', // Immediately Invoked Function Expression
  platform: 'browser',
  target: 'chrome92',
  minify: isProduction,
  sourcemap: !isProduction,
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
    'process.env.PLASMO_PUBLIC_SUPABASE_URL': `"${process.env.PLASMO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'}"`,
    'process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY': `"${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ''}"`,
  },
  external: [], // Bundle everything for Chrome extension
  plugins: [
    {
      name: 'chrome-api',
      setup(build) {
        // Mark chrome APIs as external to avoid bundling errors
        build.onResolve({ filter: /^chrome/ }, (args) => ({
          path: args.path,
          external: true
        }))
      }
    }
  ]
}).then(() => {
  console.log('✅ Content script built successfully')
}).catch((error) => {
  console.error('❌ Content script build failed:', error)
  process.exit(1)
})

// Popup Build
build({
  entryPoints: ['extension/popup.tsx'],
  bundle: true,
  outfile: 'dist/popup.js',
  format: 'iife',
  platform: 'browser',
  target: 'chrome92',
  minify: isProduction,
  sourcemap: !isProduction,
  define: {
    'process.env.NODE_ENV': `"${process.env.NODE_ENV || 'development'}"`,
    'process.env.PLASMO_PUBLIC_SUPABASE_URL': `"${process.env.PLASMO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'}"`,
    'process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY': `"${process.env.PLASMO_PUBLIC_SUPABASE_ANON_KEY || ''}"`,
  },
  jsx: 'automatic', // Handle JSX transformation
  jsxImportSource: undefined, // No custom JSX import source
  external: [],
  plugins: [
    {
      name: 'chrome-api',
      setup(build) {
        build.onResolve({ filter: /^chrome/ }, (args) => ({
          path: args.path,
          external: true
        }))
      }
    }
  ]
}).then(() => {
  console.log('✅ Popup built successfully')
}).catch((error) => {
  console.error('❌ Popup build failed:', error)
  process.exit(1)
})

// Copy static files
const filesToCopy = [
  { src: 'extension/manifest.json', dest: 'dist/manifest.json' },
  { src: 'extension/background.js', dest: 'dist/background.js' },
  { src: 'extension/popup.html', dest: 'dist/popup.html' },
  { src: 'styles/facebook-theme.css', dest: 'dist/styles/facebook-theme.css' },
  { src: 'contexts/ThemeContext.tsx', dest: 'dist/contexts/ThemeContext.tsx' },
  { src: 'components/ThemeToggle.tsx', dest: 'dist/components/ThemeToggle.tsx' },
  { src: 'supabase/functions/_shared/types.ts', dest: 'dist/types.ts' }
]

// Create subdirectories
const subdirs = ['dist/styles', 'dist/contexts', 'dist/components']
subdirs.forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
})

let copiedCount = 0
filesToCopy.forEach(({ src, dest }) => {
  try {
    if (existsSync(src)) {
      copyFileSync(src, dest)
      copiedCount++
      console.log(`📁 Copied: ${src} → ${dest}`)
    } else {
      console.warn(`⚠️  File not found: ${src}`)
    }
  } catch (error) {
    console.error(`❌ Failed to copy ${src}:`, error)
  }
})

// Build summary
console.log('\n🎉 Build Complete!')
console.log(`📊 Stats: ${copiedCount} files copied`)
console.log(`📂 Output: ${distDir}/`)
console.log('\n📋 Ready for Chrome Developer Dashboard:')
console.log('   1. Go to chrome://extensions/')
console.log('   2. Enable "Developer mode"')
console.log('   3. Click "Load unpacked"')
console.log(`   4. Select the ${distDir}/ folder`)
console.log('\n🔐 Remember to set your environment variables!')
console.log('   PLASMO_PUBLIC_SUPABASE_URL')
console.log('   PLASMO_PUBLIC_SUPABASE_ANON_KEY')