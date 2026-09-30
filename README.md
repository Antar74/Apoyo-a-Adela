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
  img/                      retrato, obras, favicon
  video/                    hero-1080 / hero-720, documental-720, pósters
  og/og.jpg                 1200×630 para compartir
tools/
  serve.py              servidor estático con soporte de Range
  contrast-check.py      verificación de contraste (desarrollo)
  og.html                plantilla de la imagen para compartir
materiales - no subir/      originales: video de 390 MB, retrato, .docx
```

`materiales - no subir/` **no debe subirse al repositorio**. El video
original pesa 390 MB; lo que se publica son los derivados de
`assets/video/`.

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
3. La entradilla de la historia va **en mayúsculas**, con el tracking
   abierto (`0.035em`) porque las versales necesitan aire. En móvil baja al
   tamaño del cuerpo: en versal ocupa mucho más ancho horizontal y, a gran
   tamaño, el bloque se comía media pantalla.

---

## Sin pies de imagen

Las siete imágenes —el retrato y las seis obras— van **sin `<figcaption>`**.
Quedan más de 700 bytes de HTML y una regla de CSS menos, y la obra manda
más. Los `alt` siguen describiendo cada imagen para quien usa lector de
pantalla. Si en algún momento se quieren títulos, se reinsertan los
`<figcaption>` dentro de cada `<figure class="work__item">`.

---

## Las imágenes de la obra

Las seis imágenes de la sección *La obra* salieron de
`materiales - no subir/`. Las cuatro primeras (obra-01, 02, 04, 05) siguen
siendo **fotogramas extraídos del video**; la tercera y la sexta ya son
archivos reales:

| posición | archivo | origen |
|---|---|---|
| 1 | `obra-01` | fotograma del video (provisional) |
| 2 | `obra-02` | fotograma del video (provisional) |
| 3 | `obra-03` | `florciones-blancas-8ymedio.png` — *Floraciones blancas* |
| 4 | `obra-04` | fotograma del video (provisional) |
| 5 | `obra-05` | fotograma del video (provisional) |
| 6 | `obra-06` | `floraciones-rosas-mnav.png` — *Floraciones rosas* |

Los `alt` de las cuatro provisionales describen el fotograma, no la obra.
Hay que reescribirlos cuando entren los archivos originales.

Para reemplazarlas: poner los originales en `assets/img/`, generar las
variantes y actualizar el `src` / `srcset` / `alt` de cada `<figure>`.

```bash
for n in 01 02 03 04 05 06; do
  for w in 700 1200 1800; do
    ffmpeg -i "assets/img/obra-$n.jpg" -vf "scale=$w:-1" \
      -quality 68 -c:v libwebp "assets/img/obra-$n-$w.webp"
  done
done
```

Nunca generar un ancho mayor que el original: `obra-03` mide 922 px y
`obra-06` 1348 px, así que sus variantes altas se paran ahí.

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

**Ritmo de fondos:** video oscuro → hueso (documental) → hueso (historia) →
tinta (obra) → hueso (cierre). El salto a tinta antes de la galería es el
momento estructural de la página.

**El velo de la apertura es local, no un lavado.** Un degradado de abajo
arriba hadía que oscurecer media imagen para llegar a 4.5:1, y la pintura
se perdía. En su lugar hay un velo elíptico detrás del bloque de texto: el
resto del cuadro queda intacto.

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
| apertura — bloque más flojo (el "eyebrow") | **4.5:1** escritorio · **7.1:1** móvil |
| apertura — título | 9.4:1 escritorio · 13.4:1 móvil |
| historia — entradilla en versales | 13.9:1 |
| historia — texto corrido | 8.3:1 |
| cierre — bajada | 5.0:1 |
| pie de página | 5.0:1 |
| "regresar al inicio" — tinta sobre hueso | 13.9:1 |
| "regresar al inicio" — hueso sobre tinta | 14.9:1 |

El mínimo en toda la página es **4.5:1**, justo en el umbral de AA. En la
apertura se midió sobre los **seis fotogramas más desfavorables** del bucle,
no sobre uno al azar, porque el texto se apoya sobre una imagen en
movimiento.

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
| FCP / LCP | 352 ms / 352 ms |
| HTML | 15 KB |
| CSS | 20 KB |
| JS | 12 KB |
| Fuente (1 woff2) | 24 KB |
| Póster de la apertura | 35 KB |
| Póster del documental | 52 KB |
| Bucle de la apertura | 2.9 MB (1080p) · 1.1 MB (720p) |
| Documental | 73 MB — **no se toca hasta pulsar reproducir** |

Sobre el pliegue solo se cargan 10 peticiones. El `<video>` del documental
va con `preload="none"`, así que los 73 MB no compiten con nada.

La apertura decide su fuente en JavaScript e inserta **una sola** (720p en
móvil, con *Save-Data* o redes 2G/3G; 1080p en el resto), de modo que nunca
se descarga el video grande por error. Sin JavaScript queda el póster.

Las siete imágenes van con `loading="lazy"` y `srcset`; el navegador elige
700 / 1200 / 1800 px según el ancho real y la densidad de píxeles.

Sin dependencias, sin framework, sin librerías de animación.

---

## Nota sobre el enlace de Patreon

Los cuatro enlaces apuntan a

```
https://www.patreon.com/apoyoaAdela/about?l=de
```

según lo especificado en el brief. El parámetro `l` fija el idioma de la
página de Patreon, y `de` es alemán. Si debería verse en español o inglés,
cambiar a `?l=es` / `?l=en` en `index.html` (4 ocurrencias).
