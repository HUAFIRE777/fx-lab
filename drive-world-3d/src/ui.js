/* drive-world-3d · src/ui.js — DOM 覆盖层：卡片 / 庆祝 / HUD（原创文案） */

const CARDS = {
  about: {
    title: '关于我们', tag: '关于',
    body: [
      '野原工作室，一支五人小团队，窝在城郊的老厂房里做网页动效。',
      '我们相信慢工出细活：一个转场也要调上三十遍，才敢交出去。',
      '白天写代码，傍晚去江边散步——灵感大多来自那段路。',
    ],
  },
  works: {
    title: '代表作品', tag: '作品',
    body: [
      '《潮汐信箱》——给陌生人写慢信的小站，上线三年，还在被人口口转寄。',
      '《一粒米的旅行》——粮食科普互动长卷，被三所小学拿去当了课件。',
      '《深夜便利店》——为独立咖啡馆做的点单页，下单时有雨声。',
    ],
  },
  skills: {
    title: '拿手好戏', tag: '技能',
    body: [
      '低多边形场景搭建：轻量、好看，千元机也能跑满帧。',
      '动效编排：让每一次点击，都有回弹的物理感。',
      'WebGL 性能优化：把 draw call 抠到个位数，是我们的强迫症。',
    ],
  },
  contact: {
    title: '联系方式', tag: '联系',
    body: [
      '邮箱 hello@yehara.studio，看到都会回，只是可能慢半拍。',
      '工作室开放日是每月最后一个周六，带电脑来就行，管一顿盒饭。',
      '合作请直接说想做什么，越具体，我们回得越快。',
    ],
  },
};

export function createUI() {
  const $ = (id) => document.getElementById(id);
  const intro = $('intro'), enterBtn = $('enterBtn'), loadTip = $('loadTip');
  const hud = $('hud'), cardWrap = $('cardWrap');
  const cardTitle = $('cardTitle'), cardTag = $('cardTag'), cardBody = $('cardBody');
  const cheer = $('cheer'), soundBtn = $('soundBtn');
  const dots = {};
  document.querySelectorAll('.ring-dot').forEach((d) => { dots[d.dataset.ring] = d; });

  const collected = new Set();
  const cooldown = {};
  let onEnterCb = null, cheerTimer = null;

  $('cardClose').addEventListener('click', () => cardWrap.classList.remove('open'));
  cardWrap.addEventListener('click', (e) => {
    if (e.target === cardWrap) cardWrap.classList.remove('open');
  });
  enterBtn.addEventListener('click', () => {
    if (enterBtn.disabled) return;
    intro.classList.add('hide');
    hud.classList.add('show');
    if (onEnterCb) onEnterCb();
  });

  return {
    onEnter(cb) { onEnterCb = cb; },
    ready() {  // 首帧渲染完成：放行进入按钮
      enterBtn.disabled = false;
      enterBtn.textContent = '点击进入驾驶';
      loadTip.textContent = 'WASD / 方向键驾驶，手机用左下摇杆';
    },
    openCard(id, blip) {
      const now = performance.now();
      if (cooldown[id] && now - cooldown[id] < 3000) return false;
      cooldown[id] = now;
      const c = CARDS[id];
      if (!c) return false;
      cardTitle.textContent = c.title;
      cardTag.textContent = c.tag;
      cardBody.innerHTML = c.body.map((p) => `<p>${p}</p>`).join('');
      cardWrap.classList.add('open');
      if (!collected.has(id)) {
        collected.add(id);
        if (dots[id]) dots[id].classList.add('got');
        if (blip) blip(520 + collected.size * 90);
      }
      if (collected.size >= 4) {
        clearTimeout(cheerTimer);
        cheer.classList.add('show');
        cheerTimer = setTimeout(() => cheer.classList.remove('show'), 4200);
        if (blip) setTimeout(() => blip(880), 250);
      }
      return true;
    },
    get collectedCount() { return collected.size; },
    setSound(on) {
      soundBtn.textContent = on ? '声音开' : '开启声音';
      soundBtn.classList.toggle('on', on);
    },
    soundBtn,
  };
}
