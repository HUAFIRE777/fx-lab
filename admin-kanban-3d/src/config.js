// huafire3d fx-lab — original implementation
// 参数中枢：看板数据、文案、动效调参全部集中在此文件，换业务只改这里。

export const CONFIG = {
  boardTitle: '研发任务看板',
  boardSub: '拖拽卡片在列之间流转 · 鼠标直接拖 / 触屏长按拖起',

  motion: {
    liftScale: 1.06,      // 拖起时放大倍数
    liftZ: 70,            // 拖起时纵深（translateZ px，配合 perspective 形成浮起感）
    tiltMax: 10,          // rotateX / rotateY 最大倾斜角度（跟随指针速度）
    longPressMs: 380,     // 触屏长按多少毫秒后拖起
    dragThresholdPx: 6,   // 鼠标移动多少 px 后判定为拖拽（小于则视为点击）
    flipMs: 240,          // 放下后 FLIP 回弹时长
    flipEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    scrollMargin: 56,     // 拖到边缘多少 px 内触发自动滚动
    scrollSpeed: 14,      // 自动滚动速度 px/帧
  },

  columns: [
    {
      id: 'todo', title: '待办',
      cards: [
        { id: 't1', code: 'TASK-1042', title: '登录页增加图形验证码', desc: '连续输错 3 次后弹出，防暴力破解。', tags: ['前端', '安全'], priority: 'high', due: '明天到期', assignee: '陈默', done: false },
        { id: 't2', code: 'TASK-1043', title: '报表导出兼容 Excel 2007+', desc: 'xlsx 流式写入，10 万行不卡死浏览器。', tags: ['后端'], priority: 'med', due: '周五', assignee: '林晓', done: false },
        { id: 't3', code: 'TASK-1044', title: '看板列支持自定义颜色', desc: '列头小圆点颜色可配，配置存 D1。', tags: ['前端'], priority: 'low', due: '下周', assignee: '陈默', done: false },
        { id: 't4', code: 'TASK-1045', title: '移动端长按拖拽手势', desc: '380ms 长按拖起，拖到边缘自动滚动。', tags: ['移动端', '交互'], priority: 'med', due: '周三', assignee: '苏晴', done: false },
      ],
    },
    {
      id: 'doing', title: '进行中',
      cards: [
        { id: 'd1', code: 'TASK-1038', title: '3D 拖拽倾斜动效联调', desc: 'rotateX / Y 跟随指针速度，物理 easing 落位。', tags: ['前端', '动效'], priority: 'high', due: '今天', assignee: '陈默', done: false },
        { id: 'd2', code: 'TASK-1039', title: 'D1 数据库索引优化', desc: '慢查询从 800ms 降到 120ms 以内。', tags: ['后端'], priority: 'med', due: '明天', assignee: '林晓', done: false },
      ],
    },
    {
      id: 'done', title: '已完成',
      cards: [
        { id: 'f1', code: 'TASK-1031', title: '暗色主题全局适配', desc: '全站 42 个页面一次过，无回归。', tags: ['前端'], priority: 'low', due: '已交付', assignee: '苏晴', done: true },
        { id: 'f2', code: 'TASK-1033', title: '卡片 FLIP 位移动画', desc: '跨列移动 240ms ease-out 落位。', tags: ['动效'], priority: 'med', due: '已交付', assignee: '陈默', done: true },
      ],
    },
  ],
};
