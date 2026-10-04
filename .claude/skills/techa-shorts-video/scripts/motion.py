"""사진에 '살짝 살아 있는' 움직임을 무료로 — AI 거리 추정(Depth Anything V2 small, CPU) + 2.5D 패럴랙스.

- 카메라가 아주 조금 움직일 때 가까운 것(꽃·소품)은 더, 먼 배경은 덜 움직인다 → 사진이 공간처럼 보인다.
- 가까운 쪽만 바람에 스치듯 미세하게 흔들린다.
- 밝은 곳(무드등·초·조명)은 은은하게 숨 쉬듯 밝아졌다 어두워진다.
사람 얼굴·손·지폐 글자를 새로 그리지 않으니 일그러질 일이 없다.
"""
import glob
import os

import cv2
import numpy as np

MODEL = glob.glob("D:/techa-shorts/models/models--onnx-community--depth-anything-v2-small/snapshots/*/onnx/model.onnx")
DEPTH_DIR = os.environ.get("TECHA_DEPTH_DIR", "D:/techa-shorts/build/work/depth")
_SESS = None


def _session():
    global _SESS
    if _SESS is None:
        import onnxruntime as ort
        _SESS = ort.InferenceSession(MODEL[0], providers=["CPUExecutionProvider"])
    return _SESS


def depth_of(rgb, key):
    """rgb: HxWx3 uint8 → 0~1 (1 = 가까움). 사진마다 한 번만 계산해 저장한다."""
    os.makedirs(DEPTH_DIR, exist_ok=True)
    fn = os.path.join(DEPTH_DIR, key.replace("/", "_").replace("\\", "_").replace(":", "") + ".npy")
    if os.path.exists(fn):
        d = np.load(fn)
    else:
        h, w = rgb.shape[:2]
        s = 518 / max(h, w)
        th, tw = max(14, int(round(h * s / 14)) * 14), max(14, int(round(w * s / 14)) * 14)
        x = cv2.resize(rgb, (tw, th), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        x = (x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
        x = x.transpose(2, 0, 1)[None].astype(np.float32)
        d = _session().run(None, {"pixel_values": x})[0][0]
        d = (d - np.percentile(d, 2)) / max(np.percentile(d, 98) - np.percentile(d, 2), 1e-6)
        d = np.clip(d, 0, 1).astype(np.float32)
        np.save(fn, d)
    d = cv2.resize(d, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_CUBIC)
    return cv2.GaussianBlur(d, (0, 0), sigmaX=max(rgb.shape[1] / 300, 2))  # 경계가 찢어지지 않게 부드럽게


_GRID = {}


def _grid(h, w):
    if (h, w) not in _GRID:
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        _GRID[(h, w)] = (yy, xx)
    return _GRID[(h, w)]


def animate(frame_rgb, depth, t, seed=0, strength=1.0):
    """출력 크기로 잘라 둔 프레임(HxWx3)과 같은 크기의 depth로 t초 시점의 움직임을 입힌다.
    움직임 지도는 절반 해상도로 계산해 키운다(지도가 부드러워 화질 차이 없음, 4배 빠름)."""
    H, W = depth.shape
    h, w = H // 2, W // 2
    d = cv2.resize(depth, (w, h), interpolation=cv2.INTER_AREA)
    rng = np.random.default_rng(seed)
    ph = rng.random(3) * 6.28
    yy, xx = _grid(h, w)
    dc = d - np.float32(np.median(d))
    # 1) 패럴랙스 — 느린 원 궤도 (한 바퀴 ~9초). 단위: 출력 px
    a = 2 * np.pi * t / 9.0 + ph[0]
    px, py = np.float32(14 * strength * np.cos(a)), np.float32(7 * strength * np.sin(a))
    ox = -px * dc
    oy = -py * dc
    # 2) 가까운 쪽만 미세하게 흔들림 (위쪽일수록 조금 더 — 줄기 끝이 흔들리듯)
    near = np.clip((d - 0.55) / 0.35, 0, 1)
    sway = np.float32(2.6 * strength) * near * (1.2 - yy / h)
    ox += sway * np.sin(np.float32(2 * np.pi * t / 3.1 + ph[1]) + yy * np.float32(2 / 140))
    oy += np.float32(0.8) * sway * np.sin(np.float32(2 * np.pi * t / 4.3 + ph[2]) + xx * np.float32(2 / 170))
    YY, XX = _grid(H, W)
    mx = XX + cv2.resize(ox, (W, H), interpolation=cv2.INTER_LINEAR)
    my = YY + cv2.resize(oy, (W, H), interpolation=cv2.INTER_LINEAR)
    out = cv2.remap(frame_rgb, mx, my, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    # 3) 밝은 곳이 숨 쉬듯 (무드등·촛불·조명)
    small = cv2.resize(out, (w // 2, h // 2), interpolation=cv2.INTER_AREA)
    lum = cv2.cvtColor(small, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    glow = np.clip((lum - 0.78) / 0.2, 0, 1)
    if glow.mean() > 0.002:
        glow = cv2.GaussianBlur(glow, (0, 0), 3)
        k = np.float32(0.10 * strength * (0.5 + 0.5 * np.sin(2 * np.pi * t / 2.4 + ph[0])))
        g = cv2.resize(glow, (W, H), interpolation=cv2.INTER_LINEAR) * k
        out = cv2.addWeighted(out, 1.0, (out * g[..., None]).astype(np.uint8), 1.0, 0)
    return out
