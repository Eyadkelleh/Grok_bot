import { describe, expect, it } from 'vitest'
import {
  BODY_RADIUS,
  NOTIF_DIST,
  NOTIF_R,
  NOTIFY_FACE,
  WIDE_FACE,
  WINK_FACE,
  notifyBadge,
  poseAt,
  sampleAt,
  sampleAvatar,
  STATE_GEOMETRY,
  STATE_REGISTRY,
} from '..'

describe('G3 measured state faces', () => {
  it('closes Wink as a wider horizontal dash, not an open eye crushed to 0', () => {
    const wink = sampleAvatar({ state: 'Wink' })
    const idle = sampleAvatar({ state: 'Idle' })
    const [open, shut] = wink.eyes
    expect(open).toBeDefined()
    expect(shut).toBeDefined()
    expect(shut!.rx).toBeCloseTo(WINK_FACE.eyes[1].w * BODY_RADIUS, 5)
    expect(shut!.ry).toBeCloseTo(WINK_FACE.eyes[1].h * BODY_RADIUS, 5)
    expect(open!.rx).toBeCloseTo(WINK_FACE.eyes[0].w * BODY_RADIUS, 5)
    expect(open!.ry).toBeCloseTo(WINK_FACE.eyes[0].h * BODY_RADIUS, 5)
    expect(shut!.rx).toBeGreaterThan(open!.rx)
    expect(shut!.ry).toBeLessThan(open!.ry)
    expect(shut!.rx).toBeGreaterThan(idle.eyes[1]!.rx)
    expect(wink.gaze).toEqual(WINK_FACE.gaze)
  })

  it('keeps WideEyes as an enlarged pair on the measured gaze', () => {
    const wide = sampleAvatar({ state: 'WideEyes' })
    const idle = sampleAvatar({ state: 'Idle' })
    expect(wide.eyes).toHaveLength(2)
    expect(wide.gaze).toEqual(WIDE_FACE.gaze)
    expect(wide.eyes[0]!.rx).toBeCloseTo(WIDE_FACE.eyes[0].w * BODY_RADIUS, 5)
    expect(wide.eyes[0]!.ry).toBeCloseTo(WIDE_FACE.eyes[0].h * BODY_RADIUS, 5)
    expect(wide.eyes[1]!.rx).toBeCloseTo(wide.eyes[0]!.rx, 5)
    expect(wide.eyes[0]!.rx).toBeGreaterThan(idle.eyes[0]!.rx)
    expect(wide.eyes[0]!.ry).toBeGreaterThan(idle.eyes[0]!.ry)
    expect(wide.eyes[0]!.x).not.toBeCloseTo(idle.eyes[0]!.x, 1)
  })

  it('aims Notification opposite the badge and keeps a rest-size badge', () => {
    const frame = sampleAvatar({ state: 'Notification' })
    const badge = frame.dots[0]!
    expect(STATE_GEOMETRY.Notification.face).toBe('notify')
    expect(frame.dots).toHaveLength(1)
    expect(frame.gaze).toEqual(NOTIFY_FACE.gaze)
    expect(Math.sign(frame.gaze.yaw)).toBe(-1)
    expect(badge.x).toBeGreaterThan(0)
    expect(badge.y).toBeLessThan(0)
    expect(Math.hypot(badge.x, badge.y)).toBeCloseTo(NOTIF_DIST, 5)
    expect(badge.r).toBeCloseTo(NOTIF_R, 5)
    expect(frame.eyes[0]!.rx).toBeCloseTo(NOTIFY_FACE.eyes[0].w * BODY_RADIUS, 5)
  })

  it('lets the Notification badge pop then settle, as a pure function of t', () => {
    const rest = notifyBadge(0)
    const peak = notifyBadge(0.22)
    const settled = notifyBadge(1.2)
    expect(peak.r).toBeGreaterThan(rest.r)
    expect(settled.r).toBeCloseTo(rest.r, 8)
    expect(notifyBadge(0.22)).toEqual(notifyBadge(0.22))
    expect(poseAt('Notification', 0).dots[0]).toEqual(STATE_REGISTRY.Notification.dots[0])
    expect(sampleAt(0.22, { state: 'Notification' }).dots[0]!.r).toBeGreaterThan(
      sampleAt(1.2, { state: 'Notification' }).dots[0]!.r,
    )
    const a = sampleAt(0.85, { state: 'Notification' })
    const b = sampleAt(0.85, { state: 'Notification' })
    expect(a.dots).toEqual(b.dots)
    expect(a.gaze).toEqual(b.gaze)
    expect(a.eyes.map((eye) => [eye.x, eye.y, eye.rx, eye.ry])).toEqual(
      b.eyes.map((eye) => [eye.x, eye.y, eye.rx, eye.ry]),
    )
  })

  it('wins over the customiser expression on Wink, WideEyes, and Notification', () => {
    const happyWink = sampleAvatar({ state: 'Wink', expression: 'happy' })
    const angryWide = sampleAvatar({ state: 'WideEyes', expression: 'angry' })
    const sadNotify = sampleAvatar({ state: 'Notification', expression: 'sad' })
    expect(happyWink.gaze).toEqual(WINK_FACE.gaze)
    expect(happyWink.eyes[1]!.rx).toBeCloseTo(WINK_FACE.eyes[1].w * BODY_RADIUS, 5)
    expect(angryWide.gaze).toEqual(WIDE_FACE.gaze)
    expect(angryWide.eyes[0]!.ry).toBeCloseTo(WIDE_FACE.eyes[0].h * BODY_RADIUS, 5)
    expect(sadNotify.gaze).toEqual(NOTIFY_FACE.gaze)
    expect(sadNotify.dots).toHaveLength(1)
  })

  it('replays the same Wink and WideEyes frame at the same t', () => {
    for (const state of ['Wink', 'WideEyes'] as const) {
      const a = sampleAvatar({ state, t: 0.4 })
      const b = sampleAvatar({ state, t: 0.4 })
      const later = sampleAvatar({ state, t: 1.1 })
      expect(a.gaze).toEqual(b.gaze)
      expect(a.eyes.map((eye) => [eye.x, eye.y, eye.rx, eye.ry])).toEqual(
        b.eyes.map((eye) => [eye.x, eye.y, eye.rx, eye.ry]),
      )
      expect(later.gaze).toEqual(a.gaze)
      expect(later.eyes.map((eye) => [eye.rx, eye.ry])).toEqual(a.eyes.map((eye) => [eye.rx, eye.ry]))
    }
  })
})
