import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { structure } from './sanity/structure'
import { schema } from './sanity/schemaTypes'
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
if (!projectId || !dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET')
}
export default defineConfig({
  name: 'default',
  title: 'Memo',
  /** Must match the Next.js route where `<NextStudio />` is mounted (e.g. `app/studio/...`). */
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema,
})