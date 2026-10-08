#!/usr/bin/env python3
# huafire3d fx-lab — original implementation
# Build: copy index.template.html -> index.html (module src stays in src/).
# Final single-file packaging is done by: python3 ~/workspace/bin/fx-singlefile.py admin-login-3d
import pathlib, shutil
ROOT = pathlib.Path(__file__).parent
shutil.copy(ROOT / 'index.template.html', ROOT / 'index.html')
print('built index.html from template')
