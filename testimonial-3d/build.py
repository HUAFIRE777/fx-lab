#!/usr/bin/env python3
# huafire3d fx-lab — original implementation
# Build: index.template.html -> index.html（源码）-> fx-singlefile.py 打成单文件。
# 注意：fx-singlefile.py 是一次性单向打包，不许对已打包的 index.html 重复跑；
#      每次改完 src/ 都走本脚本重建。
import pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).parent

def main():
    shutil.copy(ROOT / "index.template.html", ROOT / "index.html")
    r = subprocess.run(
        [sys.executable, str(pathlib.Path.home() / "workspace/bin/fx-singlefile.py"), "testimonial-3d"],
        capture_output=True, text=True,
    )
    print(r.stdout, end="")
    if r.returncode != 0:
        print(r.stderr, file=sys.stderr)
        sys.exit(r.returncode)

if __name__ == "__main__":
    main()
