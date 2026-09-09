import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { poseCycle } from '../../engine'
import { createStudioSession, type StudioSession } from '../session'

let session: StudioSession

function open() {
  session = createStudioSession()
  return session
}

describe('studio session', () => {
  beforeEach(() => {
    window.localStorage.clear()
    history.replaceState(null, '', '/')
  })

  afterEach(() => {
    session?.dispose()
    history.replaceState(null, '', '/')
  })

  it('keeps each desk look to itself', () => {
    const s = open()

    s.image.commit({ field: 'shape', value: 'droplet' })
    s.image.commit({ field: 'colour', value: 'violet' })
    s.image.commit({ field: 'expression', value: 'proud' })

    expect(s.image.frame.value.shape).toBe('droplet')
    expect(s.video.frame.value.shape).toBe('circle')
    expect(s.video.frame.value.colour).toBe('ink')
    expect(s.video.frame.value.expression).toBe('neutral')

    s.video.commit({ field: 'shape', value: 'cloud' })

    expect(s.image.frame.value.shape).toBe('droplet')
    expect(s.video.frame.value.shape).toBe('cloud')
  })

  it('keeps each desk pose to itself', () => {
    const s = open()

    s.image.commit({ field: 'pose', value: 'Comet' })
    s.video.commit({ field: 'pose', value: 'Orbit' })

    expect(s.image.config.value.pose).toBe('Comet')
    expect(s.video.config.value.pose).toBe('Orbit')
  })

  it('brands each desk look with its owner', () => {
    const s = open()
    s.video.commit({ field: 'shape', value: 'hexagon' })

    expect(s.image.config.value.look.owner).toBe('image')
    expect(s.video.config.value.look.owner).toBe('video')
  })

  it('survives a reload with both desks intact', () => {
    const first = open()
    first.image.commit({ field: 'shape', value: 'capsule' })
    first.video.commit({ field: 'colour', value: 'amber' })
    first.dispose()

    const second = open()

    expect(second.image.config.value.look.shape).toBe('capsule')
    expect(second.image.config.value.look.colour).toBe('ink')
    expect(second.video.config.value.look.shape).toBe('circle')
    expect(second.video.config.value.look.colour).toBe('amber')
  })

  it('previews a facet on the hovered desk without persisting it', () => {
    const s = open()

    s.image.preview({ field: 'shape', value: 'triangle' })

    expect(s.image.frame.value.shape).toBe('triangle')
    expect(s.image.config.value.look.shape).toBe('circle')
    expect(s.video.frame.value.shape).toBe('circle')

    s.image.preview(null)
    expect(s.image.frame.value.shape).toBe('circle')
  })

  it('shares banner copy while keeping the plate per desk', () => {
    const s = open()

    s.setBannerCopy({ welcome: 'Willkommen' })
    s.image.commit({ field: 'banner', value: 'banner-2' })

    expect(s.bannerCopy.value.welcome).toBe('Willkommen')
    expect(s.image.config.value.look.banner).toBe('banner-2')
    expect(s.video.config.value.look.banner).toBeNull()
  })

  it('offers only the formats a desk can actually produce', () => {
    const s = open()

    expect(s.image.delivery.value.formats).toEqual(['png', 'svg'])
    expect(s.video.delivery.value.formats).not.toContain('png')
    expect(s.video.delivery.value.formats).toContain('gif')

    s.image.commit({ field: 'banner', value: 'banner-3' })
    expect(s.image.delivery.value.formats).toContain('banner-png')
  })
})

describe('video transport', () => {
  beforeEach(() => {
    window.localStorage.clear()
    history.replaceState(null, '', '/')
  })

  afterEach(() => {
    session?.dispose()
    history.replaceState(null, '', '/')
  })

  it('derives the rendered pose from the playhead instead of writing it', () => {
    const s = open()
    s.video.commit({ field: 'pose', value: 'Comet' })
    s.video.editMontage({ op: 'set-blocks', id: s.video.activeCycle.value.id, blocks: poseCycle('Comet').blocks })

    s.video.transport.play()
    s.video.transport.seek(0.8)

    expect(s.video.frame.value.pose).toBe('Comet')
    expect(s.video.config.value.pose).toBe('Comet')

    s.video.transport.seek(0.1)
    expect(s.video.frame.value.pose).toBe('Idle')
    expect(s.video.config.value.pose).toBe('Comet')
  })

  it('keeps the live animation when the shape changes mid-playback', () => {
    const s = open()
    s.video.editMontage({ op: 'set-blocks', id: s.video.activeCycle.value.id, blocks: poseCycle('Orbit').blocks })
    s.video.transport.play()
    s.video.transport.seek(0.8)
    expect(s.video.frame.value.pose).toBe('Orbit')

    s.video.commit({ field: 'shape', value: 'hexagon' })

    expect(s.video.transport.playing.value).toBe(true)
    expect(s.video.frame.value.shape).toBe('hexagon')
    expect(s.video.frame.value.pose).toBe('Orbit')
    expect(s.video.frame.value.playhead).toBeCloseTo(0.8)
    expect(s.video.frame.value.blocks).toHaveLength(3)
  })

  it('stops the transport when a pose is picked, so the click sticks', () => {
    const s = open()
    s.video.transport.play()

    s.video.commit({ field: 'pose', value: 'Burst' })

    expect(s.video.transport.playing.value).toBe(false)
    expect(s.video.frame.value.pose).toBe('Burst')
  })

  it('clips the current pose onto the track as visible state', () => {
    const s = open()
    s.video.commit({ field: 'pose', value: 'Comet' })

    s.video.clipCurrentPose()

    expect(s.video.activeCycle.value.blocks).toEqual([
      { state: 'Idle', duration: 0.4 },
      { state: 'Comet', duration: 1.2 },
      { state: 'Idle', duration: 0.4 },
    ])

    s.video.clipCurrentPose()
    expect(s.video.activeCycle.value.blocks).toHaveLength(3)
  })

  it('leaves the image desk with no montage to play', () => {
    const s = open()
    expect(s.image.frame.value.blocks).toEqual([])
    expect(s.image.frame.value.playhead).toBeNull()
  })
})

describe('studio location', () => {
  beforeEach(() => {
    window.localStorage.clear()
    history.replaceState(null, '', '/')
  })

  afterEach(() => {
    session?.dispose()
    history.replaceState(null, '', '/')
  })

  it('writes the desk to the query and the pose to the fragment', () => {
    const s = open()
    expect(location.search).toBe('?desk=image')
    expect(location.hash).toBe('#etat=idle&stop')

    s.focusDesk('video')
    expect(location.search).toBe('?desk=video')
    expect(location.hash).toBe('#etat=idle&stop')

    s.video.commit({ field: 'pose', value: 'Orbit' })
    expect(location.hash).toBe('#etat=orbit&stop')
  })

  it('opens the desk named in the query', () => {
    history.replaceState(null, '', '/?desk=video')
    const s = open()
    expect(s.focus.value).toBe('video')
  })

  it('still resolves a legacy pose-only share link onto the focused desk', () => {
    history.replaceState(null, '', '/#etat=thinking&stop')
    const s = open()

    expect(s.focus.value).toBe('image')
    expect(s.image.config.value.pose).toBe('Thinking')
    expect(s.video.config.value.pose).toBe('Idle')
  })

  it('follows a later fragment change', async () => {
    const s = open()
    history.replaceState(null, '', `${location.pathname}?desk=image#etat=orbit&stop`)
    window.dispatchEvent(new HashChangeEvent('hashchange'))

    expect(s.image.config.value.pose).toBe('Orbit')
  })
})
