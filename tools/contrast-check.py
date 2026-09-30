"""Verifica el contraste del texto de la apertura sobre el video.

El texto de la apertura se apoya en un video en movimiento, asi que su
contraste cambia con cada fotograma. Este script mide el PEOR caso: toma
capturas de la pagina con el texto oculto y calcula la razon de
contraste de cada bloque contra los colores reales del texto.

Uso
---
  1) Sirve el sitio y captura fotogramas del bucle con el texto oculto.
     Ejemplo con Playwright (390x844):

       for t in [0.5, 2, 4, 6, 8, 10, 12, 13.5]:
         # pausar el video en t, ocultar .hero__content / .site-header,
         # guardar shots/bg-mobile-<t>.png
         ...

  2) python tools/contrast-check.py "shots/bg-mobile-*.png"

Umbrales WCAG 2.1 (1.4.3):
  texto pequeno  4.5:1
  texto grande   3.0:1   (>= 24px, o >= 18.66px en negrita)
"""

import glob
import sys
from PIL import Image

# Colores reales, de assets/css/styles.css
ON_DARK = (246, 239, 227)  # --on-dark   titulo y CTA
ON_DARK_2 = (207, 199, 186)  # --on-dark-2 eyebrow y bajada

# Rectangulos del bloque de texto sobre un viewport de 390x844 (movil).
# Si el diseno cambia, vuelve a medirlos con getBoundingClientRect().
BLOCKS = {
    "eyebrow": ((18, 494, 372, 512), ON_DARK_2, 4.5),
    "titulo": ((18, 528, 372, 626), ON_DARK, 3.0),
    "tagline": ((18, 646, 372, 694), ON_DARK_2, 4.5),
    "cta": ((18, 736, 372, 774), ON_DARK, 4.5),
}

AAA = 7.0


def _lin(c):
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _lum(rgb):
    r, g, b = (_lin(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a, b):
    la, lb = _lum(a), _lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def worst(path, box, colour):
    im = Image.open(path).convert("RGB")
    w, h = im.size
    x0, y0, x1, y1 = box
    px = im.load()
    low = 99.0
    for y in range(max(0, y0), min(y1, h)):
        for x in range(max(0, x0), min(x1, w)):
            low = min(low, ratio(colour, px[x, y]))
    return low


def grade(v):
    if v >= AAA:
        return "AAA"
    if v >= 4.5:
        return "AA"
    if v >= 3.0:
        return "solo texto grande"
    return "FALLA"


def main(pattern):
    files = sorted(glob.glob(pattern))
    if not files:
        sys.exit(f"sin capturas para '{pattern}'")
    print(f"{len(files)} fotogramas\n")
    failures = 0
    overall = 99.0
    for name, (box, colour, need) in BLOCKS.items():
        v = min(worst(f, box, colour) for f in files)
        overall = min(overall, v)
        ok = v >= need
        failures += 0 if ok else 1
        print(
            f"  {name:<9} {v:>6.2f}:1   {grade(v):<17} "
            f"{'ok' if ok else 'FALLA (pide %.1f:1)' % need}"
        )
    print(f"\npeor global {overall:.2f}:1")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "shots/bg-mobile-*.png"))
