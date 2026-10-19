// Script to import SVG templates and generate starter-templates.ts
import { importTemplatesFromManifest } from '../lib/certificate-builder/svg-importer'
import { writeFileSync } from 'fs'
import { join } from 'path'

async function main() {
  console.log('Importing templates...')
  
  const manifestPath = join(process.cwd(), 'public/templates/manifest.json')
  const imported = await importTemplatesFromManifest(manifestPath)
  
  console.log(`Imported ${imported.length} templates`)
  
  // Generate TypeScript file
  const output = `// Auto-generated from SVG templates
// Do not edit manually - run \`npm run import-templates\` to regenerate

import { type CertificateDesignV2 } from './design-v2'

export interface StarterTemplate {
  id: string
  name: string
  orientation: 'landscape' | 'portrait'
  tags: string[]
  config: CertificateDesignV2
}

export const STARTER_TEMPLATES: StarterTemplate[] = ${JSON.stringify(
    imported.map(({ meta, design }) => ({
      id: meta.id,
      name: meta.name,
      orientation: meta.orientation,
      tags: meta.tags,
      config: design,
    })),
    null,
    2
  )}
`
  
  const outputPath = join(process.cwd(), 'lib/certificate-builder/starter-templates.ts')
  writeFileSync(outputPath, output, 'utf-8')
  
  console.log(`✓ Generated ${outputPath}`)
  console.log('Done!')
}

main().catch(console.error)
