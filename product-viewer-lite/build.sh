#!/bin/bash
# huafire3d fx-lab — original implementation
# 从模板重建单文件演示页（fx-singlefile.py 是单向打包，勿对已打包文件重跑）
set -e
cd "$(dirname "$0")"
cp src/index.template.html index.html
python3 ~/workspace/bin/fx-singlefile.py product-viewer-lite
