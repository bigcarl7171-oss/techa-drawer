#!/usr/bin/env python3
"""안 쓴 사진 찾기 — 후보 사진을 이미 쓴 사진과 지각 해시(dHash)로 대조한다 (2026-10-21, routine-draft S0 4번).

  python scripts/unused-photos.py "D:/…/사진폴더" ["다른 폴더" …] [--max 10] [--refresh]

이미 쓴 사진 = 이 저장소의 blog/**·assets/** 그림 + 스크래치 원고 폴더 C:/연습/원고작업/** 그림.
같은 사진을 잘라 쓴 경우도 잡도록 원본·가운데 90/75/60% 크롭·정사각·4:3 크롭 해시를 함께 비교한다.
거리(0~64)가 --max(기본 10) 이하면 "이미 씀"으로 보고, 출력은 거리 · 파일 · (가장 닮은 기존 파일).
기준 해시는 scripts/.unused-photos-cache.json 에 저장한다(--refresh 로 다시 만든다, gitignore 대상 아님 — 커밋하지 않는다).
"""
import argparse, glob, io, json, os, sys
from PIL import Image, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
CACHE = os.path.join(HERE, '.unused-photos-cache.json')
EXT = ('.jpg', '.jpeg', '.png', '.webp')
SCRATCH = r'C:/연습/원고작업'


def dh(im):
    g = im.convert('L').resize((9, 8), Image.LANCZOS)
    p = list(g.getdata())
    return sum(1 << i for i in range(64) if p[(i // 8) * 9 + i % 8] > p[(i // 8) * 9 + i % 8 + 1])


def variants(path):
    im = ImageOps.exif_transpose(Image.open(path))
    w, h = im.size
    out = [dh(im)]
    for f in (.9, .75, .6):
        cw, ch = int(w * f), int(h * f)
        out.append(dh(im.crop(((w - cw) // 2, (h - ch) // 2, (w + cw) // 2, (h + ch) // 2))))
    s = min(w, h)
    out.append(dh(im.crop(((w - s) // 2, (h - s) // 2, (w + s) // 2, (h + s) // 2))))
    if h > w:
        out.append(dh(im.crop((0, (h - w * 3 // 4) // 2, w, (h + w * 3 // 4) // 2))))
    elif h * 4 // 3 < w:
        cw = h * 4 // 3
        out.append(dh(im.crop(((w - cw) // 2, 0, (w + cw) // 2, h))))
    return out


def files(root):
    for p in glob.glob(os.path.join(root, '**', '*'), recursive=True):
        if p.lower().endswith(EXT):
            yield p


def build_refs():
    refs = {}
    for root in (os.path.join(REPO, 'blog'), os.path.join(REPO, 'assets'), SCRATCH):
        for p in files(root):
            try:
                refs[p] = variants(p)
            except Exception:
                pass
    json.dump(refs, io.open(CACHE, 'w', encoding='utf-8'))
    return refs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('folders', nargs='+')
    ap.add_argument('--max', type=int, default=10)
    ap.add_argument('--refresh', action='store_true')
    a = ap.parse_args()
    refs = build_refs() if a.refresh or not os.path.exists(CACHE) else json.load(io.open(CACHE, encoding='utf-8'))
    sys.stdout.reconfigure(encoding='utf-8')
    unused, used = [], []
    for folder in a.folders:
        for p in sorted(files(folder)):
            try:
                v = variants(p)
            except Exception:
                continue
            best, who = 99, ''
            for r, rv in refs.items():
                d = min(bin(x ^ y).count('1') for x in v for y in rv)
                if d < best:
                    best, who = d, r
            (used if best <= a.max else unused).append((best, p, who))
    print(f'# 안 쓴 사진 {len(unused)}장 (거리 > {a.max})')
    for d, p, _ in unused:
        print(f'{d:2d}  {p}')
    print(f'\n# 이미 쓴 사진 {len(used)}장 (거리 ≤ {a.max}) — 쓰지 않는다')
    for d, p, who in used:
        print(f'{d:2d}  {p}  ← {who}')


if __name__ == '__main__':
    main()
