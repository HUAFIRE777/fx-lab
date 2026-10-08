/* drive-world-3d · src/audio.js — WebAudio 合成引擎声（原创，无音频文件） */

export function createEngineSound() {
  let ctx = null, osc = null, filter = null, gain = null;
  let enabled = false, ready = false;

  function build() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 2;
    gain = ctx.createGain(); gain.gain.value = 0;
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start();
    ready = true;
  }

  // 短促"叮"：圆环触发音
  function blip(freq = 660) {
    if (!ready || !enabled) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(), gn = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq;
    gn.gain.setValueAtTime(0.12, t);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(gn).connect(ctx.destination);
    o.start(t); o.stop(t + 0.4);
  }

  return {
    unlock() {           // 用户手势内调用
      if (!ready) build();
      if (ctx.state === 'suspended') ctx.resume();
    },
    toggle() {
      this.unlock();
      enabled = !enabled;
      return enabled;
    },
    get enabled() { return enabled; },
    setSpeed(speed, maxSpeed) {
      if (!ready) return;
      const t = ctx.currentTime;
      const k = Math.min(Math.abs(speed) / maxSpeed, 1);
      const targetGain = enabled ? 0.015 + k * 0.05 : 0;
      gain.gain.setTargetAtTime(targetGain, t, 0.1);
      osc.frequency.setTargetAtTime(55 + k * 130, t, 0.08);
      filter.frequency.setTargetAtTime(420 + k * 900, t, 0.1);
    },
    blip,
  };
}
