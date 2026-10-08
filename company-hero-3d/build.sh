#!/bin/bash
# huafire3d fx-lab — original implementation
# company-hero-3d 构建：index.src.html -> index.html -> fx-singlefile 打包（单向，一次性）
set -e
D=~/workspace/fx-lab/company-hero-3d
cp "$D/index.src.html" "$D/index.html"
python3 ~/workspace/bin/fx-singlefile.py company-hero-3d
echo "build done: $D/index.html"
