// huafire3d fx-lab — original implementation · quiz-check-3d
// 题目数据：题干 / 选项 / 正确答案下标 / 解析，全部人话手写

export const QUESTIONS = [
  {
    tag: '生物 · 光合作用',
    text: '植物进行光合作用的主要场所是哪里？',
    options: ['线粒体', '叶绿体', '细胞核', '液泡'],
    answer: 1,
    explain: '叶绿体里的叶绿素负责吸收光能，把二氧化碳和水变成葡萄糖和氧气。线粒体是管"呼吸"的，别和光合作用搞混了。',
  },
  {
    tag: '数学 · 勾股定理',
    text: '一个直角三角形的两条直角边分别是 3 和 4，它的斜边长是多少？',
    options: ['5', '6', '7', '12'],
    answer: 0,
    explain: '3² + 4² = 25，开方得 5。"勾三股四弦五"说的就是这一组数，记住它，以后一眼就能看出来。',
  },
  {
    tag: '英语 · 词汇辨析',
    text: 'The movie was so ______ that I fell asleep halfway.（这部电影太____，我看到一半就睡着了。）',
    options: ['boring（无聊的）', 'exciting（刺激的）', 'moving（感人的）', 'amazing（惊人的）'],
    answer: 0,
    explain: '人都睡着了，电影只可能是 boring（无聊的）。顺带区分一下：bored 是"人感到无聊的"，boring 是"东西让人无聊的"，别用反了。',
  },
];

export const SCORE_LINES = [
  { min: 3, title: '满分！', sub: '这套题对你来说太简单了，下一套可以上难度了。' },
  { min: 2, title: '答对 2 题', sub: '基础不错，把错的那道解析看明白，再来一轮就能全对。' },
  { min: 1, title: '答对 1 题', sub: '别急，先把每道题的解析读一遍，理解比刷题数重要。' },
  { min: 0, title: '这次全错', sub: '没关系，从解析开始，一道一道啃，下一轮一定更好。' },
];
