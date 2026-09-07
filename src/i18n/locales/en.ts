import type fr from './fr'

const en: typeof fr = {
  app: {
    name: 'Grok_bot',
    title: 'Grok_bot — SVG avatar studio',
    tagline: 'Customise, animate, and export an SVG avatar.',
    botAria: 'Grok_bot avatar',
  },

  nav: {
    label: 'Navigation',
    studio: 'Studio',
    customise: 'Customise',
    settings: 'Settings',
    about: 'About',
  },

  panel: {
    title: 'Customise',
    shape: 'Shape',
    expression: 'Expression',
    colour: 'Colour',
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
    cycles: 'Cycles',
    blockAria: '{state}, {duration}',
    blockDurationAria: 'Duration of {state}, {duration}',
    blockRemoveAria: 'Remove {state}',
    moveLeft: 'Move {state} left',
    moveRight: 'Move {state} right',
  },

  dialog: {
    cancel: 'Cancel',
    nameCreateTitle: 'New cycle',
    nameRenameTitle: 'Rename cycle',
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
    png: 'Download PNG',
    svg: 'Download SVG',
    gif: 'Download GIF',
    mp4: 'Download MP4',
    done: 'Exported',
    failed: 'Export failed',
  },

  settings: {
    title: 'Settings',
    language: 'Language',
    about: 'About',
    credits: 'Independent recreation of {name} (MIT).',
    creditsAria: 'bloub on GitHub, in a new tab',
    github: 'View Grok_bot on GitHub',
    githubAria: 'The Grok_bot repository on GitHub, in a new tab',
    disclaimer: 'Not affiliated with, endorsed by, or connected to xAI.',
  },
}

export default en
