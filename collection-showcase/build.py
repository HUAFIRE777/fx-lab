#!/usr/bin/env python3
# huafire3d fx-lab — original implementation
# Build: 1) index.template.html -> index.html
#        2) vendor/addons/draco/* -> src/draco-inline.gen.js（wasm base64 + wrapper 源码内联，
#           单文件打包后 Draco 解码零外部路径）
import base64, json, pathlib

ROOT = pathlib.Path(__file__).parent

def gen_draco():
    draco_dir = ROOT / 'vendor' / 'addons' / 'draco'
    wasm_b64 = base64.b64encode((draco_dir / 'draco_decoder.wasm').read_bytes()).decode()
    wrapper = (draco_dir / 'draco_wasm_wrapper.js').read_text()
    out = (
        '/* 自动生成（build.py），勿手改 */\n'
        '/* huafire3d fx-lab — original implementation */\n'
        f'export const DRACO_WASM_B64 = "{wasm_b64}";\n'
        f'export const DRACO_WRAPPER_SRC = {json.dumps(wrapper)};\n'
    )
    (ROOT / 'src' / 'draco-inline.gen.js').write_text(out)
    print(f'draco-inline.gen.js OK ({len(out)//1024} KB)')

def main():
    (ROOT / 'index.html').write_text((ROOT / 'index.template.html').read_text())
    print('index.html <- index.template.html')
    gen_draco()

if __name__ == '__main__':
    main()
