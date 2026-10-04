/* =============================================================
   Apoyo a Adela — comportamiento mínimo
   1. Carga del video solo si el contexto lo permite
   2. La cabecera cambia de estado al salir de la apertura
   3. Aparición suave del texto y las obras al desplazarse

   SPDX-License-Identifier: GPL-3.0-or-later
   Ver LICENSE. Los archivos de assets/img, assets/og y assets/video
   NO son software: (c) Adela Casacuberta, todos los derechos
   reservados (LICENSES/ASSETS.txt).
   ============================================================= */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- Video ------------------------------------------ */

  function initVideo() {
    var video = document.getElementById('heroVideo');
    if (!video) return;

    /* Movimiento reducido: no se descarga nada, el póster queda
       como imagen fija. La información nunca depende del video. */
    if (reduceMotion.matches) return;

    var connection = navigator.connection || {};
    var isNarrow = window.matchMedia('(max-width: 900px)').matches;
    var isSlow =
      connection.saveData === true ||
      /^(slow-2g|2g|3g)$/.test(connection.effectiveType || '');

    var source = document.createElement('source');
    source.type = 'video/mp4';
    source.src = isNarrow || isSlow
      ? 'assets/video/hero-720.mp4'
      : 'assets/video/hero-1080.mp4';

    video.appendChild(source);
    video.muted = true;            /* Safari exige la propiedad también */
    video.load();

    /* Si el navegador bloquea el autoplay, el póster permanece
       visible. No hay controles ni estado de error visible. */
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(function () { /* poster permanece */ });
    }

    /* Fuera de pantalla el video no necesita seguir descargando. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var resume = video.play();
            if (resume && typeof resume.catch === 'function') {
              resume.catch(function () {});
            }
          } else if (!video.paused) {
            video.pause();
          }
        });
      }, { threshold: 0.05 }).observe(video);
    }
  }

  /* ---------- Reproductor -------------------------------------- */

  /* Interfaz mínima: reproducir, volumen y pantalla completa.
     El video trae preload="none" y pesa 73 MB, asi que no se descarga
     hasta que se pulsa reproducir. */

  function initPlayer() {
    var root = document.querySelector('[data-player]');
    if (!root) return;

    var video   = root.querySelector('.player__video');
    var seek    = root.querySelector('[data-action="play"]') ? root.querySelector('.player__seek') : null;
    var vol     = root.querySelector('.player__vol');
    var timeOut = root.querySelector('[data-time]');
    var btnPlay = root.querySelector('[data-action="play"]');
    var btnMute = root.querySelector('[data-action="mute"]');
    var btnFs   = root.querySelector('[data-action="fullscreen"]');

    if (!video || !seek || !btnPlay) return;

    var seeking = false;

    function fmt(seconds) {
      if (!isFinite(seconds)) return '0:00';
      var m = Math.floor(seconds / 60);
      var s = Math.floor(seconds % 60);
      return m + ':' + (s < 10 ? '0' : '') + s;
    }

    function paintSeek() {
      var pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      seek.style.backgroundSize = pct + '% 2px';
    }

    function paintTime() {
      if (timeOut) timeOut.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
    }

    function paintVolume() {
      if (vol) vol.value = video.muted ? 0 : video.volume;
      var silent = video.muted || video.volume === 0;
      root.classList.toggle('is-muted', silent);
      if (btnMute) {
        btnMute.setAttribute('aria-pressed', String(silent));
        btnMute.setAttribute('aria-label', silent ? 'Activar el sonido' : 'Silenciar');
      }
    }

    function togglePlay() {
      if (video.paused) {
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        video.pause();
      }
    }

    function toggleFullscreen() {
      var target = document.fullscreenElement ? document : root;
      if (document.fullscreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
      } else if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();   /* iPhone solo admite el video */
      }
    }

    btnPlay.addEventListener('click', togglePlay);
    if (btnMute) {
      btnMute.addEventListener('click', function () {
        video.muted = !video.muted;
        paintVolume();
      });
    }
    if (btnFs) btnFs.addEventListener('click', toggleFullscreen);

    if (vol) {
      vol.addEventListener('input', function () {
        video.volume = Number(vol.value);
        video.muted = video.volume === 0;
        paintVolume();
      });
    }

    seek.addEventListener('pointerdown', function () { seeking = true; });
    seek.addEventListener('input', function () {
      if (!video.duration) return;
      video.currentTime = (Number(seek.value) / 100) * video.duration;
      paintSeek();
    });
    ['pointerup', 'pointercancel', 'change'].forEach(function (evt) {
      seek.addEventListener(evt, function () { seeking = false; });
    });

    video.addEventListener('play',  function () { root.classList.add('is-playing');    btnPlay.setAttribute('aria-label', 'Pausar el documental'); });
    video.addEventListener('pause', function () { root.classList.remove('is-playing'); btnPlay.setAttribute('aria-label', 'Reproducir el documental'); });
    video.addEventListener('timeupdate', function () {
      if (!seeking) seek.value = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      paintSeek();
      paintTime();
    });
    video.addEventListener('loadedmetadata', paintTime);
    video.addEventListener('volumechange', paintVolume);

    document.addEventListener('fullscreenchange', function () {
      root.classList.toggle('is-fullscreen', !!document.fullscreenElement);
      if (btnFs) {
        btnFs.setAttribute('aria-label',
          document.fullscreenElement ? 'Salir de pantalla completa' : 'Ver a pantalla completa');
      }
    });

    /* Atajos, solo cuando el foco está dentro del reproductor */
    root.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT') return;
      var handled = true;
      switch (e.key) {
        case ' ': case 'k': case 'K': togglePlay(); break;
        case 'm': case 'M': if (btnMute) btnMute.click(); break;
        case 'f': case 'F': if (btnFs) btnFs.click(); break;
        case 'ArrowRight': video.currentTime += 5; break;
        case 'ArrowLeft':  video.currentTime -= 5; break;
        case 'ArrowUp':
          /* Al subir el volumen se quita el mute: si no, el usuario
             mueve la flecha y no ve ningun cambio. */
          video.muted = false;
          video.volume = Math.min(1, video.volume + 0.1);
          paintVolume();
          break;
        case 'ArrowDown':
          video.volume = Math.max(0, video.volume - 0.1);
          paintVolume();
          break;
        default: handled = false;
      }
      if (handled) e.preventDefault();
    });

    paintVolume();
    paintSeek();
  }

  /* ---------- Boton del documental ------------------------------- */

  /* El boton que esta sobre el video de la apertura lleva a la
     seccion del documental y lo arranca con sonido.

     El destino no es scrollIntoView sobre la seccion: eso alinea el
     borde superior de la seccion con el borde superior de la
     ventana, y el reproductor queda por debajo del pliegue en
     pantallas bajas. Se calcula el desplazamiento que deja el
     reproductor ENTERO a la vista, con un margen para la cabecera.

     El play() se llama DENTRO del gesto del usuario a proposito: si
     se difiriese hasta terminar el desplazamiento, el navegador ya no
     lo contaria como gesto y bloquearia el audio. */

  function initPlayFilm() {
    var button = document.querySelector('[data-play-film]');
    var film = document.getElementById('pelicula');
    var video = document.getElementById('filmVideo');
    if (!button || !film || !video) return;

    button.addEventListener('click', function () {
      var player = video.closest('.player') || video;
      var box = player.getBoundingClientRect();
      var header = document.getElementById('siteHeader');

      /* Espacio libre entre la cabecera fija y el borde inferior.
         Sin holgura extra: el reproductor es de 16:9 mas la barra y en
         ventanas bajas cada pixel cuenta para que quepa entero. */
      var top0 = header ? header.offsetHeight : 0;
      var bottom0 = window.innerHeight;
      var disponible = bottom0 - top0;

      /* Centro dentro de ese espacio; si el reproductor es mas alto
         que el espacio, se alinea arriba y punto. */
      var destino = window.scrollY + box.top - top0 -
                    Math.max(0, (disponible - box.height) / 2);

      /* Nunca por encima del comienzo de la seccion: si el sitio ya
         esta donde toca, no se sube para "centrar". */
      var inicioPelicula = film.getBoundingClientRect().top + window.scrollY;
      if (destino < inicioPelicula) destino = inicioPelicula;

      window.scrollTo({
        top: destino,
        behavior: reduceMotion.matches ? 'auto' : 'smooth'
      });

      /* play() DENTRO del gesto del usuario: si se difiriese hasta
         terminar el desplazamiento, el navegador ya no lo contaria
         como gesto y bloquearia el audio. */
      video.muted = false;
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () { /* el póster se queda */ });
      }
    });
  }

  /* ---------- Regresar al inicio -------------------------------- */

  /* Nace oculto y aparece al salir de la apertura. El salto lo hace
     el propio ancla (#top) con scroll-behavior: smooth; el script
     solo decide cuando mostrarla. */

  function initToTop() {
    var link = document.querySelector('[data-to-top]');
    var hero = document.getElementById('hero');
    if (!link) return;

    link.hidden = false;

    /* El color depende de la seccion que tenga REALMENTE debajo, no
       de la que este a la vista: con un IntersectionObserver por
       seccion, al final de la pagina quedaba un resto de la obra
       (tinita) arriba y el enlace se ponia en hueso sobre el cierre
       en tono claro, es decir, invisible. Aqui se comprueba que la
       seccion contenga el punto donde vive la flecha. */
    var sections = Array.prototype.slice.call(
      document.querySelectorAll('main > section')
    );

    var ticking = false;

    function update() {
      ticking = false;

      var limite = (hero ? hero.offsetHeight : window.innerHeight) * 0.7;
      link.classList.toggle('is-shown', window.scrollY > limite);

      if (!link.classList.contains('is-shown')) return;

      var box = link.getBoundingClientRect();
      var y = box.top + box.height / 2;
      var onDark = false;
      for (var i = 0; i < sections.length; i++) {
        var s = sections[i].getBoundingClientRect();
        if (y >= s.top && y <= s.bottom) {
          onDark = sections[i].classList.contains('work');
        }
      }
      link.classList.toggle('is-over-dark', onDark);
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Cabecera --------------------------------------- */

  /* La cabecera no se pinta: solo cambia de color según lo que
     tiene debajo. Sobre las secciones oscuras (apertura, obra)
     queda transparente en color hueso; sobre las claras (historia,
     cierre) adopta un fondo hueso translúcido para poder leerse. */

  function initHeader() {
    var header = document.getElementById('siteHeader');
    if (!header) return;

    var lightSections = document.querySelectorAll('.film, .story, .outro');
    if (!lightSections.length) return;

    if (!('IntersectionObserver' in window)) {
      header.classList.add('is-solid');
      return;
    }

    function measure() {
      var h = header.offsetHeight || 64;
      return '-' + h + 'px 0px ' + -Math.max(0, window.innerHeight - h - 1) + 'px 0px';
    }

    var observer = new IntersectionObserver(function (entries) {
      var onLight = entries.some(function (e) { return e.isIntersecting; });
      header.classList.toggle('is-solid', onLight);
    }, { rootMargin: measure(), threshold: 0 });

    lightSections.forEach(function (el) { observer.observe(el); });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        lightSections.forEach(function (el) { observer.observe(el); });
      }, 200);
    }, { passive: true });
  }

  /* ---------- Aparición al desplazar ------------------------ */

  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    items.forEach(function (el) { observer.observe(el); });
  }

  function boot() {
    initVideo();
    initPlayer();
    initPlayFilm();
    initHeader();
    initToTop();
    initReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();