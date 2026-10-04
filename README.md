# Apoyo a Adela

Sitio de una sola página para la red de apoyo de **Adela Casacuberta**,
artista y diseñadora mexicano-uruguaya.

Una única acción de conversión: **Apoyar → Patreon**.

---

## Puesta en marcha

No hay build. No hay dependencias. Es HTML, CSS y JavaScript planos.

```bash
python tools/serve.py 8124
```

Usa ese servidor y no `python -m http.server`: el de la biblioteca
estándar **ignora la cabecera `Range`** y devuelve el video entero (73 MB)
en cada peticion, con lo que el reproductor no puede buscar posiciones.
`tools/serve.py` responde `206 Partial Content` correctamente. En GitHub
Pages las peticiones por rango funcionan solas.

## Publicar en GitHub Pages

1. Sube el contenido de este repositorio a la rama `main` (o `gh-pages`).
2. En **Settings → Pages**, elige *Deploy from a branch* y la rama.
3. Listo.

Todas las rutas son relativas (`assets/…`, `./`), así que funciona igual en
`usuario.github.io/repo/` que en la raíz de un dominio propio. El archivo
`.nojekyll` evita que Jekyll procese el sitio.

---

## Estructura

```
index.html                  una sola página, sin plantillas
assets/
  css/styles.css            tokens de color, tipografía y componentes
  js/main.js                video de apertura, reproductor, cabecera, reveals
  img/                      retrato, obras, favicon        [1]
  video/                    hero-1080 / hero-720, documental-720, pósters  [1]
  og/og.jpg                 1200×630 para compartir        [1]
tools/
  serve.py                  servidor estático con soporte de Range
  contrast-check.py         verificación de contraste (desarrollo)
  og.html                   plantilla de la imagen para compartir
LICENSES/
  GPL-3.0-or-later.txt      licencia del código
  ASSETS.txt                derechos sobre el material visual [1]
LICENSE                     resumen de las dos licencias
materiales - no subir/      originales: video de 390 MB, retrato, .docx
```

`materiales - no subir/` **no debe subirse al repositorio**. El video
original pesa 390 MB; lo que se publica son los derivados de
`assets/video/`.

[1] Estos archivos **no** están bajo la GPL. Son obra con derechos de autor
de Adela Casacuberta, todos los derechos reservados. Ver *Licencia* abajo.

---

## La tipografía

**Libre Caslon Text** para todo el sitio, de Google Fonts. Es una
revitalización de Caslon, libre (OFL).

Tres consecuencias:

1. **Caslon solo tiene un peso (400).** No hay bold. La jerarquía sale del
   cuerpo, del interlineado y del espaciado, nunca de un peso. El CSS lo
   blinda con `font-synthesis-weight: none` para que el navegador no invente
   un bold falso, que en Caslon se ve mal.
2. **El LCP subió de 68 ms a 352 ms**, porque la fuente ahora es una
   petición de red que bloquea el pintado. Sigue muy por debajo del umbral
   "bueno" de 2.5 s. Si algún día importa más, se puede volver a alojar la
   fuente en el repositorio y recuperar los 68 ms.
3. La entradilla de la historia va en caja normal, 6 px mas grande que el`n   cuerpo. Se probo primero en mayusculas, pero ocupaban media pantalla en`n   movil. Ver *Decisiones de diseño*.

---

## Pies de imagen

Cada obra lleva su nombre debajo, en versalitas espaciadas y muy
discretas (`HONGOS ROSADOS (MNAV), 2026`). El `alt` de cada imagen repite
el título y describe la pieza para quien usa lector de pantalla.

Los pies van a `rgba(240, 231, 215, 0.62)` sobre el fondo tinta: **6.1:1**,
de sobra por encima de AA.

---

## Las imágenes de la obra

Las nueve imágenes de la sección *La obra* son **las obras reales**, no
fotogramas del video. Salen de `materiales - no subir/nuevas/` y ya no hay
ninguna provisional:

| # | archivo en `assets/img/` | obra | original |
|---|---|---|---|
| 1 | `hongos-rosados-mnav-2026` | *Hongos rosados* (MNAV), 2026 | 6265×3877 |
| 2 | `autorretrato-2024` | *Autorretrato*, 2024 | 3120×4160 |
| 3 | `mimesis-floraciones` | *Mimesis — floraciones*, 8 y medio | 1686×2998 |
| 4 | `cuadro-superficie` | *Cuadro superficie* | 5658×5658 |
| 5 | `catastrofe-floraciones-2021` | *Catástrofe floraciones*, 2021 | 2800×1867 |
| 6 | `retratos-desde-la-ruina-2023` | *Retratos desde la ruina 2*, 2023 | 3313×2486 |
| 7 | `hongos-rosados-2024` | *Hongos rosados*, 2024 | 9176×5976 |
| 8 | `casa-sin-escalera-2023` | *Casa sin escalera*, 2023 | 2000×1333 |
| 9 | `mimesis-ensayos-origen-2024` | *Mimesis (Ensayos desde el origen)*, 2024 | 2580×1720 |

Se conservan **las proporciones originales**: no se recortó nada. La
retícula asimétrica ya produce el ritmo porque las nine tienen formatos
muy distintos (dos verticales, una cuadrada, el resto apaisadas).

Tratamiento de cada archivo:

- Copiado a `assets/img/<nombre>.jpg` a 1200 px, calidad 5. Es el `src` de
  reserva para navegadores sin `srcset`; no tiene por qué pesar más.
- Tres variantes WebP (700 / 1200 / 1800 px) en calidad 66, **nunca más
  anchas que el original**: `mimesis-floraciones` mide 1686 px, así que su
  variante alta se para ahí. Los cuatro archivos juntos pesan 3.8 MB.
- El `width`/`height` del `<img>` lleva el tamaño **original**, no el de la
  variante, para que el navegador reserve la proporción sin saltos.

```bash
# regenerar las variantes de una imagen nueva
n=cuadro-superficie
for w in 700 1200 1800; do
  ffmpeg -i "$n.jpg" -vf "scale=$w:-1" -quality 66 -c:v libwebp "$n-$w.webp"
done
ffmpeg -i "$n.jpg" -vf scale=1200:-1 -q:v 5 "$n.jpg"
```

Con `-quality 68` a 78 el resultado es indistinguible al 100 % y pesa un
20 % más, así que 66 es el punto. La única imagen realmente pesada es
`hongos-rosados-mnav-2026` (~300 KB a 1800 px): es una fotografía de
exterior con mucho follaje y detalle fino, que WebP comprime mal.

---

## Los dos videos

Hay **dos** piezas de video distintas y no confundirlas:

| archivo | qué es | tamaño |
|---|---|---|
| `hero-1080.mp4` / `hero-720.mp4` | bucle ambiental de 14 s, sin audio, de la apertura | 2.9 / 1.1 MB |
| `documental-720.mp4` | el documental completo, 10:10, **con audio** | 73 MB |

### El bucle de la apertura

Segmento 74–90 s del original (la superficie pintada y la mano con el
pincel), sin audio, con un fundido de 2 s que cruza el final con el
principio para que el empalme no se vea.

```bash
SRC="materiales - no subir/APOYOAADELA VIDEO.mp4"

ffmpeg -ss 74 -t 16 -i "$SRC" -filter_complex \
"[0:v]fps=24,scale=1920:1080:flags=lanczos,split[a][b];\
 [a]trim=0:14,setpts=PTS-STARTPTS[main];\
 [b]trim=0:2,setpts=PTS-STARTPTS[head];\
 [main][head]xfade=transition=fade:duration=2:offset=12,format=yuv420p[v]" \
 -map "[v]" -an -c:v libx264 -profile:v high -preset slow -crf 25 \
 -movflags +faststart assets/video/hero-1080.mp4
```

### El documental

El original son 610 s a 1920×1080 y 5.1 Mbps. Para la web:

```bash
ffmpeg -i "$SRC" -vf scale=1280:720:flags=lanczos \
  -c:v libx264 -profile:v high -preset medium -crf 25 \
  -c:a aac -b:a 128k -ac 2 -movflags +faststart \
  assets/video/documental-720.mp4
```

Se queda en 720p y ~956 kbps porque lleva **audio**: es una película que
alguien va a ver, no un fondo. Bajarla a 480p reduciría el coste de
transferencia, a costa de la imagen; son 73 MB, la mayor partida del sitio.

---

## El reproductor

Interfaz mínima, dibujada con la paleta en vez de la del navegador:
reproducir, volumen (botón de silencio + cursor) y pantalla completa, más
una barra de progreso delgada.

La barra de progreso **no estaba en el encargo**, pero un documental de diez
minutos sin poder avanzar es inservible. Si prefieres solo los tres botones,
borrar `.player__seek` y su `<label>` del HTML y las reglas `.player__seek`
del CSS.

Detalles que importan:

- `preload="none"` + `<source>` en el HTML: **no se descarga un byte** hasta
  pulsar reproducir. Medido: `readyState 0`, 0 bytes.
- En iPhone, `requestFullscreen` no existe para un contenedor: se cae a
  `webkitEnterFullscreen` sobre el `<video>`.
- Atajos, solo con el foco dentro del reproductor: `espacio` o `k`
  reproducir/pausar, `m` silencio, `f` pantalla completa, `←`/`→` ±5 s,
  `↑`/`↓` volumen. Subir el volumen quita el mute, porque si no mueves la
  flecha y no ocurre nada visible.
- Cada botón cambia su `aria-label` con el estado, y el de silencio lleva
  `aria-pressed`.

---

## Decisiones de diseño

**Paleta extraída de la obra**, no inventada. Sale de un fotograma de una
pintura de Adela (marrón cálido, círculo magenta, punto verdeamarillo):

| token | hex | uso |
|---|---|---|
| `--bone` | `#F0E7D7` | fondo de la historia, el documental y el cierre |
| `--ink` | `#221A19` | texto, fondo de la obra |
| `--magenta` | `#D8396E` | acento en los CTA |
| `--green` | `#A8BE33` | acento del foco y del reproductor |
| `--coral` | `#D9834F` | acento |
| `--violet` | `#6C5573` | acento |

Cada sección usa **un solo acento**, y la sección de la obra no usa ninguno:
ahí manda el color de las obras.

**Ritmo de fondos:** video oscuro → rosa pálido (documental) → hueso
(historia) → tinta (obra) → hueso (cierre). El salto a tinta antes de la
galería es el momento estructural de la página.

**El velo de la apertura es rosa, no negro, y es local.** Un degradado de
abajo arriba hadía que oscurecer media imagen para llegar a 4.5:1, y la
pintura se perdía. Ahora es un velo elíptico `--wine` (`#5A1029`, el
magenta de la paleta apagado) detrás del bloque de texto, con el resto del
cuadro intacto.

> **El velo está a media opacidad y por eso la apertura NO cumple AA.**
> Es una decisión consciente, no un descuido: con el velo al 50 % el texto
> queda entre **1.5:1 y 2.9:1**, por debajo incluso del 3:1 que se pide
> para texto grande. La opción que sí cumplía era 0.95 / 0.90 / 0.82
> (4.67:1). Para compensar **sin oscurecer más el fondo**, el texto lleva
> una sombra del mismo vino del velo: mejora la lectura real, aunque WCAG
> no la puntúe.
>
> Valores medidos, por si quieres moverlos:
>
> | alfa (centro / medio / suelo) | «eyebrow» | título | bajada |
> |---|---|---|---|
> | **0.48 / 0.42 / 0.41 — el actual** | 1.64:1 | 1.99:1 | 1.54:1 |
> | 0.70 / 0.60 / 0.54 | 2.03:1 | 2.88:1 | 2.57:1 |
> | 0.95 / 0.90 / 0.82 — cumple AA | 4.67:1 | 5.64:1 | 6.35:1 |

**El interlineado de los dos titulares es 1.28, medido, no elegido a ojo.**
Libre Caslon Text tiene ascendentes y descendentes largos: con las métricas
reales de la fuente, hacen falta **1.232** solo para que dos líneas no se
toquen. Los dos títulos —el de la apertura y el del cierre— llevan 1.28,
y el tracking se abre a `-0.005em`. Antes iban en 1.08 y 0.98, y el
descendente de la «y» de *Apoyo* invadía la *A* de *Adela*.

**La entradilla no va en mayúsculas.** Se probaron las dos cosas (versales
y 6 px más grande) y las versales ocupaban media pantalla en móvil: el
bloque pasaba de 11 a 18 líneas. Ahora va en caja normal, 6 px más grande
que el cuerpo y en tinta pleine.

**El botón de la apertura lleva al documental.** Está centrado sobre el
video; al pulsarlo desplaza hasta dejar el reproductor **entero a la
vista** y lo arranca con sonido.

Dos detalles: el destino no es `scrollIntoView` sobre la sección (eso
alinea el borde superior de la sección con el de la ventana y deja el
reproductor bajo el pliegue), sino un `scrollTo` calculado que lo centra
en el espacio libre entre la cabecera y el borde inferior, sin holguras
extra. Y el `play()` se llama dentro del gesto del usuario a propósito:
si se difiriese hasta terminar el desplazamiento, el navegador ya no lo
contaría como gesto y bloquearía el audio.

Comprobado al 100 % visible en 1440×900, 1024×520, 390×844 y 320×568. En
un teléfono en horizontal (844×390) no cabe entero: el reproductor mide
477 px en una ventana de 390 px. Ahí no hay solución geométrica.

**La cabecera no se pinta sobre la obra.** Solo cambia de color según lo que
tiene debajo: transparente en hueso sobre las secciones oscuras, con fondo
hueso translúcido sobre las claras.

**Sin animación de entrada en la apertura.** La medí: retrasaba el LCP hasta
1408 ms. El video ya aporta el movimiento.

**"Regresar al inicio"** es un enlace fijo abajo a la derecha que aparece al
salir de la apertura. Dos detalles que costaron un par de pruebas:

- Se oculta con `visibility`, no solo con `opacity`. Un enlace con
  `opacity: 0` sigue siendo enfocable por teclado, y un enlace invisible de
  verdad no se puede ver.
- Su color depende de la sección que tenga **debajo**, medida en el punto
  donde vive la flecha. Con un `IntersectionObserver` por sección, al final
  de la página quedaba un resto de 52 px de la obra (tinita) arriba y el
  enlace se ponía en hueso sobre el cierre de tono claro: invisible.

En móvil se reduce a la flecha sola, en un disco de 40 px. En texto completo
tapaba el final de cada línea del relato, que en móvil ocupa todo el ancho.

---

## Accesibilidad

Verificado, no supuesto.

| elemento | razón |
|---|---|
| **apertura — texto sobre el video** | **1.5:1 – 2.9:1 — NO cumple** |
| historia — entradilla | 13.9:1 |
| historia — texto corrido | 8.3:1 |
| obra — pie de imagen | 6.1:1 |
| cierre — bajada | 5.0:1 |
| pie de página | 5.0:1 |
| reproductor — barra sobre tinta | 14.9:1 |
| "regresar al inicio" — tinta sobre rosa | 12.0:1 |
| "regresar al inicio" — tinta sobre hueso | 13.9:1 |
| "regresar al inicio" — hueso sobre tinta | 14.9:1 |

**El único punto que no cumple es el texto de la apertura**, y es
deliberado: el velo está a media opacidad por decisión propia (ver *Decisiones
de diseño*). El resto de la página va de 5:1 a 14:1.

En la apertura se midió sobre los **seis fotogramas más desfavorables** del
bucle, no sobre uno al azar, porque el texto se apoya sobre una imagen en
movimiento.

Las cajas de medición son los rectángulos reales de cada línea de texto
(`Range.getClientRects()`), no la caja del bloque: medir sobre el espacio
vacío a la derecha del "eyebrow" daba un falso negativo de casi 3:1.

- **`prefers-reduced-motion`**: no se descarga video, el póster queda fijo,
  las apariciones se muestran de inmediato y las transiciones duran 0 s.
- **Teclado**: enlace de salto, orden de tabulación correcto, foco visible
  (verde sobre oscuro, magenta sobre claro), atajos en el reproductor, y
  ningún elemento con foco puede quedar transparente ni invisible.
- **Semántica**: un `h1`, cuatro `h2` (tres solo para lectores de pantalla,
  para no inventar encabezados visibles), `lang="es"`, `alt` en las siete
  imágenes y en el video.
- Sin desbordamiento horizontal entre 320 px y 2560 px.

Para volver a comprobar el contraste: ocultar `.hero__content` y
`.site-header`, pausar el video en varios segundos, capturar, y pasar las
capturas al script (`python tools/contrast-check.py "shots/*.png"`). Las
coordenadas de las cajas están al principio del archivo.

---

## Rendimiento

Medido en frío, escritorio 1440×900:

| | |
|---|---|
| FCP / LCP | 324 ms / 324 ms |
| HTML | 18 KB |
| CSS | 24 KB |
| JS | 13 KB |
| Fuente (1 woff2) | 24 KB |
| Póster de la apertura | 35 KB |
| Póster del documental | 52 KB |
| Bucle de la apertura | 2.9 MB (1080p) · 1.1 MB (720p) |
| Documental | 73 MB — **no se toca hasta pulsar reproducir** |

Sobre el pliegue solo se cargan 11 peticiones. El `<video>` del documental
va con `preload="none"`, así que los 73 MB no compiten con nada.

La apertura decide su fuente en JavaScript e inserta **una sola** (720p en
móvil, con *Save-Data* o redes 2G/3G; 1080p en el resto), de modo que nunca
se descarga el video grande por error. Sin JavaScript queda el póster.

Las diez imágenes van con `loading="lazy"` y `srcset`; el navegador elige
700 / 1200 / 1800 px según el ancho real y la densidad de píxeles. Las nueve
obras de la galería pesan 3.8 MB en total, pero ninguna se pide hasta que
aparece en pantalla.

Sin dependencias, sin framework, sin librerías de animación.

---

## Licencia

Hay dos licencias distintas en este repositorio, y conviene no mezclarlas.

| Qué | Licencia |
|---|---|
| `index.html`, `assets/css/`, `assets/js/`, `tools/` | **GPL-3.0-or-later** |
| `assets/img/`, `assets/og/`, `assets/video/` | **(c) Adela Casacuberta — todos los derechos reservados** |

- `LICENSE` — resumen de las dos, en un vistazo.
- `LICENSES/GPL-3.0-or-later.txt` — el texto de la GPL v3, íntegro y sin
  modificar. Cubre **solo el código**.
- `LICENSES/ASSETS.txt` — quién es la titular del material visual, qué se
  puede hacer con él y qué no.

**Que el repositorio esté bajo GPL v3 no significa que las imágenes estén
bajo GPL.** El retrato, las obras y el documental son obra con derechos de
autor y están aquí para poder verse, no para reutilizarse. Se permite
mirarlas, descargarlas e imprimirlas; no copiarlas, publicarlas, recortarlas
ni incluirlas en otra licencia sin permiso escrito de la titular.

Los seis archivos de código llevan la cabecera `SPDX-License-Identifier:
GPL-3.0-or-later` para que la distinción se pueda leer automáticamente.

> **Pendiente:** falta poner el nombre del titular de los derechos del
> **código**. Está en `<year> <name of author>` dentro del apéndice de
> `LICENSES/GPL-3.0-or-later.txt` y conviene sustituirlo por el año y el
> nombre reales antes de publicar.

---

## Nota sobre el enlace de Patreon

Los cuatro enlaces apuntan a

```
https://www.patreon.com/apoyoaAdela/about?l=de
```

según lo especificado en el brief. El parámetro `l` fija el idioma de la
página de Patreon, y `de` es alemán. Si debería verse en español o inglés,
cambiar a `?l=es` / `?l=en` en `index.html` (4 ocurrencias).
