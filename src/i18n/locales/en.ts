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
    settings: 'Settings',
    about: 'About',
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
