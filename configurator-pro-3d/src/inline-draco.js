// configurator-pro-3d · src/inline-draco.js
// 内联 Draco 加载器（原创重写）：
// DRACOLoader 默认用 FileLoader 去 decoderPath 拉 wrapper.js + .wasm 两个文件。
// 单文件模板不允许额外请求，于是子类化并重写 _loadLibrary，
// 对约定的两个文件名直接返回内存里的资源（字符串 / ArrayBuffer），
// 其它文件名回退给父类实现。数据见 draco-assets.js。

import { DRACOLoader } from '../vendor/addons/loaders/DRACOLoader.js';
import { DRACO_WRAPPER_SRC, DRACO_WASM_B64 } from './draco-assets.js';

function b64ToArrayBuffer(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export class InlineDRACOLoader extends DRACOLoader {
  constructor() {
    super();
    // decoderPath 置空：我们不再从网络取任何解码器文件
    this.setDecoderPath('');
  }

  _loadLibrary(url, responseType) {
    if (url === 'draco_wasm_wrapper.js') {
      return Promise.resolve(DRACO_WRAPPER_SRC);
    }
    if (url === 'draco_decoder.wasm') {
      return Promise.resolve(b64ToArrayBuffer(DRACO_WASM_B64));
    }
    return super._loadLibrary(url, responseType);
  }
}
