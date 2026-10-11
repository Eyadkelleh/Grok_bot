import type fr from './fr'

const en: typeof fr = {
  app: {
    name: 'Grok_bot',
    title: 'Grok_bot — SVG avatar studio',
    tagline: 'Design your bot, then take it away as an image or a video.',
    botAria: 'Grok_bot avatar',
  },

  nav: {
    label: 'Navigation',
    rollup: 'Rollup',
    settings: 'Settings',
    about: 'About',
  },

  dock: {
    label: 'Outputs',
    image: 'Image',
    video: 'Video',
    imageHint: 'PNG · SVG',
    videoHint: 'GIF · MP4',
    imageAria: 'Image desk',
    videoAria: 'Video desk',
  },

  panel: {
    title: 'Customise',
    shape: 'Shape',
    expression: 'Expression',
    colour: 'Colour',
    skinLimited: 'Shape and expression may not apply to this state.',
  },

  studio: {
    modes: 'Studio modes',
    shape: 'Shape',
    face: 'Face',
    aura: 'Aura',
    motion: 'Motion',
    shapeLocked: 'This pose keeps its own outline.',
  },

  rollup: {
    title: 'Rollup',
    lead: 'Event banner layout, not the bot.',
  },

  fond: {
    title: 'Backdrop',
    none: 'None',
    banner01: 'Light banner',
    banner2: 'Blue banner',
    banner3: 'Dark banner',
    welcome: 'Welcome',
    event1: 'Event name',
    event2: 'Line 2',
    eventPlaceholder: 'Event name',
  },

  shapes: {
    circle: 'Circle',
    pebble: 'Pebble',
    squircle: 'Squircle',
    capsule: 'Capsule',
    triangle: 'Triangle',
    hexagon: 'Hexagon',
    cloud: 'Cloud',
    droplet: 'Droplet',
  },

  colors: {
    ink: 'Ink',
    cream: 'Cream',
    brown: 'Brown',
    red: 'Red',
    orange: 'Orange',
    amber: 'Amber',
    green: 'Green',
    turquoise: 'Turquoise',
    blue: 'Blue',
    violet: 'Purple',
    pink: 'Pink',
    grey: 'Grey',
  },

  expressions: {
    neutral: 'Neutral',
    attentive: 'Attentive',
    surprised: 'Surprised',
    excited: 'Excited',
    happy: 'Happy',
    laughing: 'Laughing',
    angry: 'Angry',
    sad: 'Sad',
    scared: 'Scared',
    wary: 'Wary',
    confused: 'Confused',
    curious: 'Curious',
    proud: 'Proud',
    shy: 'Shy',
    bored: 'Bored',
    sleepy: 'Sleepy',
  },

  animations: {
    title: 'Animations',
    label: 'Animation states',
    Idle: 'Idle',
    Thinking: 'Thinking',
    Wink: 'Wink',
    WideEyes: 'Wide eyes',
    Alert: 'Alert',
    Notification: 'Notification',
    Exclamation: 'Exclamation',
    Sleep: 'Sleep',
    Egg: 'Egg',
    Hexagon: 'Hexagon',
    Play: 'Play',
    Orbit: 'Orbit',
    Burst: 'Burst',
    Comet: 'Comet',
  },

  timeline: {
    play: 'Start playback',
    pause: 'Stop playback',
    addAnimation: 'Add an animation',
    addAnimationNamed: 'Add {state}',
    cycles: 'Cycles',
    blockAria: '{state}, {duration}',
    blockDurationAria: 'Duration of {state}, {duration}',
    blockRemoveAria: 'Remove {state}',
    moveLeft: 'Move {state} left',
    moveRight: 'Move {state} right',
  },

  video: {
    timeline: 'Timeline',
  },

  dialog: {
    cancel: 'Cancel',
    nameField: 'Cycle name',
    nameCreate: 'Create',
    nameRename: 'Rename',
    removeTitle: 'Delete "{name}"?',
    removeDetail: 'This sequence will be lost, along with its {n} animations.',
    removeConfirm: 'Delete',
  },

  cycles: {
    defaultName: 'Default cycle',
    newName: 'My cycle',
    menuNew: 'New cycle',
    menuRenameAria: 'Rename {name}',
    menuRemoveAria: 'Delete {name}',
  },

  units: {
    seconds: '{n} s',
    secondsShort: '{n}s',
  },

  export: {
    title: 'Export',
    primary: 'Download {format} · {name}',
    png: 'Download PNG',
    svg: 'Download SVG',
    gif: 'Download GIF',
    mp4: 'Download MP4',
    metaPose: '{name} · {duration} · short clip of this pose',
    metaCycle: '{name} · {duration} · {count} animations in the timeline',
    busy: 'Exporting…',
    progress: 'Exporting… {percent}%',
    cancel: 'Cancel export',
    mp4Unavailable: 'This browser cannot encode MP4',
    done: 'Exported',
    failed: 'Export failed',
    banner: '2×6 banner',
    bannerPng: 'Banner PNG',
    bannerMp4: 'Banner MP4',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
    about: 'About',
    credits: 'Independent recreation of {name} (MIT).',
    creditsAria: 'bloub on GitHub, in a new tab',
    github: 'View Grok_bot on GitHub',
    githubAria: 'The Grok_bot repository on GitHub, in a new tab',
    disclaimer: 'Not affiliated with, endorsed by, or connected to xAI.',
  },
}

export default en
