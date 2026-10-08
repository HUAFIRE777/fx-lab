#!/bin/bash
# huafire3d fx-lab — original implementation
# 构建单文件：每次都从 template 重新拷（fx-singlefile.py 是单向打包，不可重复跑）
set -e
D=~/workspace/fx-lab/admin-kanban-3d
cp "$D/index.template.html" "$D/index.html"
python3 ~/workspace/bin/fx-singlefile.py admin-kanban-3d
