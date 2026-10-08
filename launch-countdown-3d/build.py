#!/usr/bin/env python3
"""huafire3d fx-lab — original implementation
launch-countdown-3d 构建脚本：
  1) index.src.html -> index.html（源码永远保留在 .src.html，可重复构建）
  2) 调 ~/workspace/bin/fx-singlefile.py 打单文件（模型 URL 保持 R2 外链）
用法: python3 build.py
"""
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
SINGLEFILE = os.path.expanduser("~/workspace/bin/fx-singlefile.py")


def main():
    shutil.copyfile(
        os.path.join(HERE, "index.src.html"),
        os.path.join(HERE, "index.html"),
    )
    r = subprocess.run([sys.executable, SINGLEFILE, "launch-countdown-3d"])
    if r.returncode != 0:
        print("singlefile 打包失败", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
