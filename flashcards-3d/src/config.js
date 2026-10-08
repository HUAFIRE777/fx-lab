// huafire3d fx-lab — original implementation · flashcards-3d
// 8 张抽认卡：正面（单词/音标/词性）+ 背面（释义/例句/译文），全部人话手写

export const CARDS = [
  {
    word: 'serendipity', phon: '/ˌser.ənˈdɪp.ə.ti/', pos: 'n.',
    meaning: '意外发现珍宝的运气；机缘巧合',
    eg: 'Finding that old bookstore was pure serendipity.',
    egCn: '在旧城里撞见那家旧书店，纯粹是机缘巧合。',
  },
  {
    word: 'ephemeral', phon: '/ɪˈfem.ər.əl/', pos: 'adj.',
    meaning: '短暂的；朝生暮死的',
    eg: 'Cherry blossoms are beautiful because they are ephemeral.',
    egCn: '樱花之美，正在于它的短暂。',
  },
  {
    word: 'resilient', phon: '/rɪˈzɪl.jənt/', pos: 'adj.',
    meaning: '有韧性的；能快速恢复的',
    eg: 'Kids are often more resilient than adults think.',
    egCn: '孩子常常比大人以为的更有韧性。',
  },
  {
    word: 'ubiquitous', phon: '/juːˈbɪk.wə.təs/', pos: 'adj.',
    meaning: '无处不在的',
    eg: 'Smartphones have become ubiquitous in daily life.',
    egCn: '智能手机在日常生活中已无处不在。',
  },
  {
    word: 'meticulous', phon: '/məˈtɪk.jə.ləs/', pos: 'adj.',
    meaning: '一丝不苟的；谨小慎微的',
    eg: 'She keeps a meticulous record of every expense.',
    egCn: '她把每一笔开销都记得一丝不苟。',
  },
  {
    word: 'nostalgia', phon: '/nɒsˈtæl.dʒə/', pos: 'n.',
    meaning: '怀旧；乡愁',
    eg: 'The old songs filled him with nostalgia.',
    egCn: '那些老歌勾起了他满满的怀旧。',
  },
  {
    word: 'pragmatic', phon: '/præɡˈmæt.ɪk/', pos: 'adj.',
    meaning: '务实的；讲究实际的',
    eg: "Let's take a pragmatic approach to this problem.",
    egCn: '这个问题，我们务实一点来解决。',
  },
  {
    word: 'luminous', phon: '/ˈluː.mɪ.nəs/', pos: 'adj.',
    meaning: '发光的；明澈的',
    eg: 'Her luminous eyes lit up the whole room.',
    egCn: '她明澈的眼睛照亮了整个房间。',
  },
];

export const DONE_LINES = [
  { min: 8, title: '全部一遍过！', sub: '这 8 个词已经在你脑子里安家了，明天再快速过一遍，记得更牢。' },
  { min: 6, title: '掌握得不错', sub: '有几个词多看了两眼才记住，睡前再翻一遍，明天它们就都是"一遍过"了。' },
  { min: 4, title: '还在路上', sub: '忘记的卡片会自动回到待复习堆，多刷两轮，堆会越来越薄。' },
  { min: 0, title: '先混个脸熟', sub: '第一轮本来就是用来"认生词"的，再来一轮，你会发现有一半已经眼熟了。' },
];
