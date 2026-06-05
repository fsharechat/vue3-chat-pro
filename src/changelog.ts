export interface ChangelogEntry {
  version: string
  date: string
  items: string[]
}

export const changelog: ChangelogEntry[] = [
  {
    version: '1.1.9',
    date: '2026-06-05',
    items: [
      '关于页面更新日志区域设置最大高度，超出可滚动查看',
    ]
  },
  {
    version: '1.1.8',
    date: '2026-06-05',
    items: [
      '关于页面新增版本更新日志列表',
      '关于按钮新增红点提示，升级后自动提醒用户查看',
    ]
  },
  {
    version: '1.1.7',
    date: '2026-06-05',
    items: [
      '语音消息：播放时显示波纹动画，气泡宽度随时长动态变化',
      '语音播放全局单例，切换会话或 tab 隐藏时自动停止',
      '图片/文件上传完成后再发 WebSocket，确保对端可下载',
      '右键菜单新增图片/视频下载功能（直接下载不跳转）',
      '转发弹框新增语音消息预览卡片',
    ]
  },
  {
    version: '1.1.6',
    date: '2026-06-05',
    items: [
      'tab 切换时当前会话也能收到提示音并累加未读角标',
      'tab 切回后自动清除当前会话未读角标',
    ]
  },
  {
    version: '1.1.5',
    date: '2026-06-05',
    items: [
      '转发位置/文件/视频/语音消息时确认弹框显示内容预览',
      '右键菜单顺序调整：转发 → 复制文本 → 撤回消息 → 删除',
    ]
  },
]
