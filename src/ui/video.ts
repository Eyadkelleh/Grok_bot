/**
 * MP4 encoding of the montage.
 *
 * The only module besides Vue that depends on another library, and it does so
 * with a DYNAMIC import: mediabunny is 43 kB gzip statically. Loaded on demand
 * it costs ~0.7 kB at first paint and only arrives when someone exports a video.
 *
 * Video is always OPAQUE. VideoEncoder refuses `alpha: 'keep'` for H.264 and VP9.
 */

import { arrete } from './export'

/**
 * Explicit quantizer, not a named QUALITY_* level.
 *
 * mediabunny's named levels do not set a bitrate when the browser can encode at
 * a fixed quantizer (Chrome 117+). They become `bitrateMode: 'quantizer'` and
 * the computed bitrate only picks the AVC level. QP 12 is near-transparent on
 * the bot's edges. The bitrate rides along as a fallback for browsers without
 * per-frame quantizer support.
 */
const QP = 12
const DEBIT_REPLI = 6_000_000

/**
 * Encode a sequence of frames as MP4.
 *
 * `rend` draws frame `i` INTO the given canvas, then returns. Frames are never
 * accumulated: each is encoded and dropped before the next, or a 30 s cycle
 * would hold 255 MB of raw pixels.
 */
export async function versMp4(
  canvas: HTMLCanvasElement,
  images: number,
  fps: number,
  rend: (index: number) => void | Promise<void>,
  avance?: (fait: number, total: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality } = await import(
    'mediabunny'
  )

  const sortie = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() })
  const source = new CanvasSource(canvas, {
    codec: 'avc',
    quality: new Quality({ quantizer: QP, bitrate: DEBIT_REPLI }),
  })
  sortie.addVideoTrack(source, { frameRate: fps })
  await sortie.start()

  try {
    const duree = 1 / fps
    for (let i = 0; i < images; i++) {
      arrete(signal)
      await rend(i)
      await source.add(i * duree, duree)
      avance?.(i + 1, images)
    }
    arrete(signal)

    await sortie.finalize()
    const buffer = sortie.target.buffer
    if (!buffer) throw new Error('mp4 encoding failed')
    return new Blob([buffer], { type: 'video/mp4' })
  } catch (e) {
    await sortie.cancel()
    throw e
  }
}
