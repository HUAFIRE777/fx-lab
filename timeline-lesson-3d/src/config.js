/* huafire3d fx-lab — original implementation · timeline-lesson-3d
 * 全部可调参数集中在这里。换课程 / 换章节 / 换节奏，只改这个文件。
 */
export const PALETTE = {
  bg: '#0E0E12',
  gold: '#C9A86A',
  cream: '#F5F1E6',
};

export const MOTION = {
  spacing: 3.4,          // 章节节点间距（世界单位）
  snapMs: 900,           // 吸附到节点时长（毫秒）
  inertiaDamp: 0.94,     // 拖拽惯性衰减
  rippleMs: 1100,        // 水波纹扩散时长
  burstLife: 1.35,       // 解锁粒子寿命（秒）
};

export const COURSE = {
  brand: '光影大师课',
  code: '手机摄影 · MASTERCLASS',
};

export const CHAPTERS = [
  {
    no: 1, title: '看见光',
    desc: '好照片都是等来的光：学会读懂清晨、正午、黄昏三种光的脾气，手机也能拍出电影感。',
    meta: ['8 课时', '52 分钟'],
  },
  {
    no: 2, title: '构图语法',
    desc: '三分法只是起点：主体、留白与视觉动线，教你把杂乱的街景收拾成一张干净的照片。',
    meta: ['10 课时', '64 分钟'],
  },
  {
    no: 3, title: '色彩情绪',
    desc: '白平衡是情绪开关：冷暖对比、色彩呼应，让同一条街拍出两种完全不同的心情。',
    meta: ['7 课时', '45 分钟'],
  },
  {
    no: 4, title: '人像心法',
    desc: '让人忘记镜头的存在：引导、抓拍与连拍节奏，拍出松弛自然、不摆拍的人像。',
    meta: ['9 课时', '58 分钟'],
  },
  {
    no: 5, title: '夜景与弱光',
    desc: '手稳、心稳、参数稳：夜景模式的正确打开方式，霓虹的绚烂和暗部的细节全都要。',
    meta: ['8 课时', '50 分钟'],
  },
  {
    no: 6, title: '作品集思维',
    desc: '从单张好照片到系列叙事：选题、排序与呈现，让你的作品被记住而不是被划过。',
    meta: ['6 课时', '40 分钟'],
  },
];
