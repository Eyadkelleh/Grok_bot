import type fr from './fr'

const zh: typeof fr = {
  app: {
    name: 'Grok_bot',
    title: 'Grok_bot — SVG 头像工作室',
    tagline: '自定义、制作动画并导出 SVG 头像。',
    botAria: 'Grok_bot 头像',
  },

  nav: {
    label: '导航',
    studio: '工作室',
    settings: '设置',
    about: '关于',
  },

  animations: {
    title: '动画',
    label: '动画状态',
    Idle: '静止',
    Thinking: '思考',
    Wink: '眨眼',
    WideEyes: '睁大眼',
    Alert: '警示',
    Notification: '通知',
    Exclamation: '感叹',
    Sleep: '睡眠',
    Egg: '蛋形',
    Hexagon: '六边形',
    Play: '播放',
    Orbit: '轨道',
    Burst: '爆发',
    Comet: '彗星',
  },

  timeline: {
    play: '开始播放',
    pause: '停止播放',
    addAnimation: '添加动画',
    cycles: '序列',
    blockAria: '{state}，{duration}',
    blockDurationAria: '{state} 的时长，{duration}',
    blockRemoveAria: '移除 {state}',
    moveLeft: '将 {state} 左移',
    moveRight: '将 {state} 右移',
  },

  dialog: {
    cancel: '取消',
    nameCreateTitle: '新建序列',
    nameRenameTitle: '重命名序列',
    nameField: '序列名称',
    nameCreate: '创建',
    nameRename: '重命名',
    removeTitle: '删除“{name}”？',
    removeDetail: '该序列将被删除，其中包含的 {n} 个动画也将一并丢失。',
    removeConfirm: '删除',
  },

  cycles: {
    defaultName: '默认序列',
    newName: '我的序列',
    menuNew: '新建序列',
    menuRenameAria: '重命名 {name}',
    menuRemoveAria: '删除 {name}',
  },

  units: {
    seconds: '{n} 秒',
    secondsShort: '{n}秒',
  },

  settings: {
    title: '设置',
    language: '语言',
    about: '关于',
    credits: '独立再创作自 {name}（MIT）。',
    creditsAria: 'bloub 的 GitHub 仓库，在新标签页中打开',
    github: '在 GitHub 上查看 Grok_bot',
    githubAria: 'Grok_bot 的 GitHub 仓库，在新标签页中打开',
    disclaimer: '与 xAI 没有任何关联、认可或从属关系。',
  },
}

export default zh
