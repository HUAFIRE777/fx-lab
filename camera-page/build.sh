#!/bin/bash
# camera-page 重建：源码 -> 单文件 index.html（一次性单向，禁止对已打包的 index.html 重复跑）
set -e
cd "$(dirname "$0")"
cp index.src.html index.html
python3 ~/workspace/bin/fx-singlefile.py camera-page
