#!/usr/bin/env python3
# huafire3d fx-lab — original implementation
# Regenerate src/draco-bin.js from vendor/draco/* (run after updating three).
import base64, pathlib
d = pathlib.Path(__file__).parent
w = base64.b64encode((d/'vendor/draco/draco_wasm_wrapper.js').read_bytes()).decode()
x = base64.b64encode((d/'vendor/draco/draco_decoder.wasm').read_bytes()).decode()
(d/'src/draco-bin.js').write_text(
  "// huafire3d fx-lab — original implementation\n"
  "// GENERATED FILE — do not edit. Regenerate: python3 build-draco-bin.py\n"
  "// Draco WASM decoder (MIT, three.js examples) inlined as base64 so the\n"
  "// single-file build stays self-contained (no relative .wasm fetch).\n"
  f"export const DRACO_WASM_WRAPPER_B64 = '{w}';\n"
  f"export const DRACO_WASM_B64 = '{x}';\n"
)
print("src/draco-bin.js regenerated")
