import type fr from './fr'

const zh: typeof fr = {
  app: {
    name: 'Grok_bot',
    title: 'Grok_bot — SVG 头像工作室',
    tagline: '设计你的机器人，然后导出为图片或视频。',
    botAria: 'Grok_bot 头像',
  },

  nav: {
    label: '导航',
    rollup: '易拉宝',
    settings: '设置',
    about: '关于',
  },

  dock: {
    label: '输出',
    image: '图片',
    video: '视频',
    imageHint: 'PNG · SVG',
    videoHint: 'GIF · MP4',
    imageAria: '图片工作台',
    videoAria: '视频工作台',
  },

  panel: {
    title: '个性化',
    shape: '外形',
    expression: '表情',
    colour: '颜色',
    skinLimited: '外形和表情可能不适用于此状态。',
  },

  studio: {
    modes: '工作室模式',
    shape: '外形',
    face: '表情',
    aura: '光晕',
    motion: '动作',
    shapeLocked: '该姿势保留自己的轮廓。',
  },

  rollup: {
    title: '易拉宝',
    lead: '活动横幅排版，不是机器人外观。',
  },

  fond: {
    title: '背景',
    none: '无',
    banner01: '浅色横幅',
    banner2: '蓝色横幅',
    banner3: '深色横幅',
    welcome: '欢迎',
    event1: '活动名称',
    event2: '第二行',
    eventPlaceholder: '活动名称',
  },

  shapes: {
    circle: '圆形',
    pebble: '卵石',
    squircle: '圆角方形',
    capsule: '胶囊',
    triangle: '三角形',
    hexagon: '六边形',
    cloud: '云朵',
    droplet: '水滴',
  },

  colors: {
    ink: '墨黑',
    cream: '奶油白',
    brown: '棕色',
    red: '红色',
    orange: '橙色',
    amber: '琥珀色',
    green: '绿色',
    turquoise: '青绿色',
    blue: '蓝色',
    violet: '紫色',
    pink: '粉色',
    grey: '灰色',
  },

  expressions: {
    neutral: '平静',
    attentive: '专注',
    surprised: '惊讶',
    excited: '兴奋',
    happy: '开心',
    laughing: '大笑',
    angry: '生气',
    sad: '难过',
    scared: '害怕',
    wary: '怀疑',
    confused: '困惑',
    curious: '好奇',
    proud: '得意',
    shy: '羞怯',
    bored: '无趣',
    sleepy: '困倦',
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
    Orbit: '环绕',
    Burst: '爆发',
    Comet: '彗星',
  },

  timeline: {
    play: '开始播放',
    pause: '停止播放',
    addAnimation: '添加动画',
    addAnimationNamed: '添加 {state}',
    cycles: '序列',
    blockAria: '{state}，{duration}',
    blockDurationAria: '{state} 的时长，{duration}',
    blockRemoveAria: '移除 {state}',
    moveLeft: '将 {state} 左移',
    moveRight: '将 {state} 右移',
  },

  video: {
    timeline: '时间轴',
  },

  dialog: {
    cancel: '取消',
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

  export: {
    title: '导出',
    primary: '下载 {format} · {name}',
    png: '下载 PNG',
    svg: '下载 SVG',
    gif: '下载 GIF',
    mp4: '下载 MP4',
    metaPose: '{name} · {duration} · 当前动作短片',
    metaCycle: '{name} · {duration} · {count} 个动画',
    busy: '正在导出…',
    progress: '正在导出… {percent}%',
    cancel: '取消导出',
    mp4Unavailable: '此浏览器无法编码 MP4',
    done: '已导出',
    failed: '导出失败',
    banner: '2×6 横幅',
    bannerPng: '横幅 PNG',
    bannerMp4: '横幅 MP4',
  },

  settings: {
    title: '设置',
    language: '语言',
    theme: '主题',
    themeLight: '浅色',
    themeDark: '深色',
    themeSystem: '跟随系统',
    about: '关于',
    credits: '独立再创作自 {name}（MIT）。',
    creditsAria: 'bloub 的 GitHub 仓库，在新标签页中打开',
    github: '在 GitHub 上查看 Grok_bot',
    githubAria: 'Grok_bot 的 GitHub 仓库，在新标签页中打开',
    disclaimer: '与 xAI 没有任何关联、认可或从属关系。',
  },
}

export default zh
