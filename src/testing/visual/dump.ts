import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { svgAutonome } from '../../ui/capture'
import { VISUAL_CASES } from './cases'
import { serialisePicture } from './golden'
import { mountCase } from './mount'
import { samplePicture } from './picture'

export async function dumpVisualCases(dir: string) {
  const engineDir = join(dir, 'engine')
  const svgDir = join(dir, 'svg')
  await mkdir(engineDir, { recursive: true })
  await mkdir(svgDir, { recursive: true })

  const manifest = []
  for (const visualCase of VISUAL_CASES) {
    const wrapper = await mountCase(visualCase)
    const svg = wrapper.get('svg').element as unknown as SVGSVGElement
    const size = Number(svg.getAttribute('width') ?? 220)
    await writeFile(join(svgDir, `${visualCase.id}.svg`), svgAutonome(svg, size))
    await writeFile(join(engineDir, `${visualCase.id}.json`), serialisePicture(samplePicture(visualCase)))
    manifest.push({
      id: visualCase.id,
      what: visualCase.what,
      face: visualCase.expect.face,
      state: visualCase.expect.state,
      target: visualCase.expect.target ?? visualCase.expect.state,
    })
    wrapper.unmount()
  }

  await writeFile(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}
