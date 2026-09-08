import { describe, expect, it } from 'vitest'
import {
  AvatarEngine,
  makeBlock,
  poseCycle,
  sampleAt,
  sampleAvatar,
  sampleLiveMorph,
  type AvatarFrame,
} from '..'

function eyeCentres(frame: AvatarFrame): Array<[number, number]> {
  return frame.eyes.map((eye) => [eye.x, eye.y])
}

function expectSameFrame(a: AvatarFrame, b: AvatarFrame) {
  expect(a.path).toBe(b.path)
  expect(eyeCentres(a)).toEqual(eyeCentres(b))
}

function anchors(d: string): Array<[number, number]> {
  const out: Array<[number, number]> = []
  const head = /^M(-?[\d.]+) (-?[\d.]+)/.exec(d)
  if (head) out.push([+head[1]!, +head[2]!])
  for (const seg of d.matchAll(/C[-\d. ]+? (-?[\d.]+) (-?[\d.]+)(?=C|Z)/g)) {
    out.push([+seg[1]!, +seg[2]!])
  }
  return out
}

function footprint(d: string) {
  const pts = anchors(d)
  const xs = pts.map((p) => p[0])
  const ys = pts.map((p) => p[1])
  return {
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
  }
}

describe('AvatarEngine.sample(t)', () => {
  it('is a pure function of time: two readings at the same date are identical', () => {
    const a = new AvatarEngine({ state: 'Idle' })
    const b = new AvatarEngine({ state: 'Idle' })
    expectSameFrame(a.sample(1.3), b.sample(1.3))

    const first = a.sample(0.7)
    a.sample(2.5)
    expectSameFrame(a.sample(0.7), first)
  })

  it('returns the same Idle body and eye centres as sampleAvatar', () => {
    const rest = sampleAvatar({ state: 'Idle', shape: 'circle', expression: 'neutral' })
    const dated = sampleAt(1, { state: 'Idle', shape: 'circle', expression: 'neutral' })
    expectSameFrame(dated, rest)
    expectSameFrame(new AvatarEngine({ state: 'Idle' }).sample(5), dated)
  })

  it('stays replayable during a morph between states', () => {
    const e = new AvatarEngine({ state: 'Idle' })
    e.setState('Egg', 1)
    const mid = e.sample(1.2)
    e.sample(3)
    expectSameFrame(e.sample(1.2), mid)
    expect(mid.path).not.toBe(sampleAvatar({ state: 'Idle' }).path)
    expect(mid.path).not.toBe(sampleAvatar({ state: 'Egg' }).path)
  })

  it('shows the outgoing state on a date before the change', () => {
    const e = new AvatarEngine({ state: 'Idle' })
    const before = e.sample(0.5)
    e.setState('Egg', 1)
    expectSameFrame(e.sample(0.5), before)
  })

  it('does not jump if pause then resume continues t', () => {
    const e = new AvatarEngine({ state: 'Idle' })
    e.setState('Egg', 1)
    const continuous = [1.0, 1.1, 1.2, 1.3].map((t) => e.sample(t))

    expectSameFrame(e.sample(1.2), continuous[2]!)
    expectSameFrame(e.sample(1.3), continuous[3]!)
    expect(continuous[2]!.path).not.toBe(continuous[3]!.path)
  })

  it('interpolates the silhouette during a transition, without a jump', () => {
    const e = new AvatarEngine({ state: 'Idle' })
    e.setState('Egg', 1)
    const widths = [1, 1.1, 1.2, 1.3, 1.4].map((t) => footprint(e.sample(t).path).w)
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]!).toBeLessThan(widths[i - 1]!)
    }
    expect(e.sample(2).path).toBe(sampleAvatar({ state: 'Egg' }).path)
  })

  it('matches sampleLiveMorph at a morph midpoint', () => {
    const e = new AvatarEngine({ state: 'Idle', shape: 'circle' })
    e.setState('Alert', 0)
    const dated = e.sample(AvatarEngine.MORPH * 0.5)
    const live = sampleLiveMorph({ from: 'Idle', to: 'Alert', t: 0.5 })
    expect(dated.path).toBe(live.path)
    expectSameFrame(dated, live)
  })

  it('morphs customiser shapes on the same clock', () => {
    const e = new AvatarEngine({ state: 'Idle', shape: 'circle' })
    e.setShape('hexagon', 1)
    const mid = e.sample(1.2)
    e.sample(3)
    expectSameFrame(e.sample(1.2), mid)
    expect(mid.path).not.toBe(sampleAvatar({ state: 'Idle', shape: 'circle' }).path)
    expect(mid.path).not.toBe(sampleAvatar({ state: 'Idle', shape: 'hexagon' }).path)
    expect(e.sample(2).path).toBe(sampleAvatar({ state: 'Idle', shape: 'hexagon' }).path)
  })

  it('seeks a montage date and can replay an earlier joint', () => {
    const e = new AvatarEngine({ state: 'Idle' }, 400)
    const blocks = poseCycle('Comet').blocks
    const at = e.seek(0.6, blocks)
    const mid = e.sample(at)
    expect(e.shownState(at)).toBe('Idle')
    expect(e.state).toBe('Comet')
    expect(mid.path).not.toBe(sampleAvatar({ state: 'Idle' }).path)
    expect(mid.path).not.toBe(sampleAvatar({ state: 'Comet', t: at }).path)

    e.seek(1, blocks)
    e.sample(1)
    const again = e.seek(0.6, blocks)
    expectSameFrame(e.sample(again), mid)
  })

  it('does not morph the first montage block in from a state that was never shown', () => {
    const e = new AvatarEngine({}, 400)
    const blocks = [makeBlock('Comet', 2), makeBlock('Thinking', 2)]
    const at = e.seek(0, blocks)
    expectSameFrame(e.sample(at), sampleAvatar({ state: 'Comet', t: at }))
    expect(e.shownState(at)).toBe('Comet')
    expect(e.state).toBe('Comet')
  })

  it('drifts Idle rest when wander is on, and stays still when it is not', () => {
    const still = new AvatarEngine({ state: 'Idle' })
    expectSameFrame(still.sample(0.4), still.sample(3.6))

    const alive = new AvatarEngine({ state: 'Idle', wander: 1 })
    const early = alive.sample(0.4)
    const later = alive.sample(3.6)
    expect(later.gaze.yaw).not.toBe(early.gaze.yaw)
    expect(eyeCentres(later)).not.toEqual(eyeCentres(early))
    expectSameFrame(alive.sample(0.4), early)
  })
})
