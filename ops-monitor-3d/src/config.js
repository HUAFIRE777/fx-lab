// ops-monitor-3d · 配置：换数据只改这里
export const CONFIG = {
  brand: "NOC · 全网监控",
  theme: {
    bg: "#05070a",
    green: "#3dffa0",
    amber: "#ffb020",
    ink: "#e9f2ec",
    inkDim: "rgba(233,242,236,.62)",
    inkFaint: "rgba(233,242,236,.36)",
  },
  // 节点：name 展示名 / tier 核心|边缘|备用 / baseLatency 基准延迟(ms) / uptime
  nodes: [
    { id: "sh", name: "核心·上海",     tier: "核心", baseLatency: 12,  uptime: 99.99, load: 62 },
    { id: "bj", name: "核心·北京",     tier: "核心", baseLatency: 14,  uptime: 99.99, load: 58 },
    { id: "hk", name: "核心·香港",     tier: "核心", baseLatency: 18,  uptime: 99.98, load: 71 },
    { id: "sg", name: "边缘节点·新加坡", tier: "边缘", baseLatency: 42,  uptime: 99.97, load: 44 },
    { id: "tk", name: "边缘节点·东京",   tier: "边缘", baseLatency: 38,  uptime: 99.98, load: 51 },
    { id: "se", name: "边缘节点·首尔",   tier: "边缘", baseLatency: 35,  uptime: 99.96, load: 39 },
    { id: "mb", name: "边缘节点·孟买",   tier: "边缘", baseLatency: 58,  uptime: 99.95, load: 47 },
    { id: "db", name: "边缘节点·迪拜",   tier: "边缘", baseLatency: 66,  uptime: 99.94, load: 33 },
    { id: "ff", name: "边缘节点·法兰克福", tier: "边缘", baseLatency: 88,  uptime: 99.96, load: 42 },
    { id: "ld", name: "边缘节点·伦敦",   tier: "边缘", baseLatency: 92,  uptime: 99.97, load: 48 },
    { id: "sv", name: "边缘节点·硅谷",   tier: "边缘", baseLatency: 128, uptime: 99.95, load: 55 },
    { id: "sy", name: "边缘节点·悉尼",   tier: "边缘", baseLatency: 95,  uptime: 99.93, load: 29 },
    { id: "sp", name: "边缘节点·圣保罗", tier: "边缘", baseLatency: 168, uptime: 99.91, load: 36 },
    { id: "va", name: "备用·弗吉尼亚",   tier: "备用", baseLatency: 132, uptime: 99.90, load: 12 },
  ],
  // 告警文案模板（随机事件用）
  alertKinds: [
    { label: "延迟抖动", detail: "P99 延迟突增至 {v}ms，已触发自动限流" },
    { label: "丢包率升高", detail: "上行丢包 {v}%，线路正在自动切换" },
    { label: "CPU 冲高", detail: "负载 {v}%，弹性扩容已启动" },
    { label: "连接重试", detail: "建连重试 {v} 次，备用链路已接管" },
  ],
  recoverNote: "已自动恢复，一切正常",
  kpis: {
    uptime:  { label: "全网在线率", unit: "%",  base: 99.98, jitter: 0.015, decimals: 2 },
    latency: { label: "平均延迟",   unit: "ms", base: 46,    jitter: 6,     decimals: 0 },
    rps:     { label: "请求 / 分钟", unit: "",  base: 18432, jitter: 900,   decimals: 0, comma: true },
  },
  motion: {
    rotateSpeed: 0.06,      // 自动旋转 rad/s
    pulseAmp: 0.22,         // 节点呼吸幅度
    rippleMs: 1800,         // 告警涟漪时长
    alertMinMs: 7000,       // 随机告警最小间隔
    alertMaxMs: 16000,      // 随机告警最大间隔
    alertHoldMs: 6000,      // 告警保持时长（琥珀色）
    kpiTickMs: 2200,        // KPI 微动间隔
  },
  ease: "cubic-bezier(.16,1,.3,1)",
};
