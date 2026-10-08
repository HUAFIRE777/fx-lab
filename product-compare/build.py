#!/usr/bin/env python3
"""huafire3d fx-lab — original implementation
product-compare 构建脚本：
  1) 把 draco 解码器（wasm + wrapper）内联为 src/draco-inline.gen.js
  2) index.template.html -> index.html
  3) 调 ~/workspace/bin/fx-singlefile.py 打单文件（模型 URL 保持 R2 外链）
用法: python3 build.py [--gen-only]
"""
import base64, json, os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
DRACO_DIR = os.path.expanduser(
    "~/workspace/fx-lab/collection-showcase/vendor/addons/draco")
SINGLEFILE = os.path.expanduser("~/workspace/bin/fx-singlefile.py")


def gen_draco():
    wrapper = open(os.path.join(DRACO_DIR, "draco_wasm_wrapper.js")).read()
    assert "</script" not in wrapper.lower(), "wrapper 含 </script，需转义"
    wasm_b64 = base64.b64encode(
        open(os.path.join(DRACO_DIR, "draco_decoder.wasm"), "rb").read()
    ).decode()
    out = (
        "/* 由 build.py 生成：draco 解码器内联，单文件包无需外部 decoder 路径 */\n"
        "export const DRACO_WRAPPER_SRC = " + json.dumps(wrapper) + ";\n"
        'export const DRACO_WASM_B64 = "' + wasm_b64 + '";\n'
    )
    p = os.path.join(HERE, "src", "draco-inline.gen.js")
    open(p, "w").write(out)
    print(f"gen {p}: {len(out)//1024} KB")


def main():
    gen_draco()
    if "--gen-only" in sys.argv:
        return
    shutil.copyfile(os.path.join(HERE, "index.template.html"),
                    os.path.join(HERE, "index.html"))
    r = subprocess.run([sys.executable, SINGLEFILE, "product-compare"])
    if r.returncode != 0:
        sys.exit(r.returncode)


if __name__ == "__main__":
    main()
