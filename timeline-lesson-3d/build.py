#!/usr/bin/env python3
"""timeline-lesson-3d 重建脚本：index.template.html -> index.html -> 单文件打包。
禁止对已打包的 index.html 重复跑本脚本（单向打包器）。"""
import shutil, subprocess, os
D = os.path.dirname(os.path.abspath(__file__))
shutil.copy(os.path.join(D, 'index.template.html'), os.path.join(D, 'index.html'))
subprocess.run(['python3', os.path.expanduser('~/workspace/bin/fx-singlefile.py'), 'timeline-lesson-3d'], check=True)
print('build ok: timeline-lesson-3d/index.html')
