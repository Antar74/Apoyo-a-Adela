"""Servidor estatico minimo CON soporte de Range.

El http.server de Python ignora la cabecera Range y devuelve el archivo
entero, asi que un <video> no puede buscar posiciones dentro del archivo.
Para probar el reproductor hace falta uno que si responda 206.

    python tools/serve.py 8124
"""

import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json",
    ".mp4": "video/mp4",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _resolve(self):
        path = self.path.split("?", 1)[0].lstrip("/")
        full = os.path.join(ROOT, path)
        if os.path.isdir(full):
            full = os.path.join(full, "index.html")
        if not os.path.abspath(full).startswith(ROOT):
            return None
        return full if os.path.isfile(full) else None

    def do_HEAD(self):
        self._serve(head=True)

    def do_GET(self):
        self._serve(head=False)

    def _serve(self, head):
        full = self._resolve()
        if not full:
            self.send_error(404, "Not Found")
            return

        size = os.path.getsize(full)
        ctype = TYPES.get(os.path.splitext(full)[1].lower(), "application/octet-stream")
        start, end = 0, size - 1
        status = 200

        rng = self.headers.get("Range")
        if rng:
            m = re.match(r"bytes=(\d*)-(\d*)", rng)
            if m:
                if m.group(1):
                    start = int(m.group(1))
                    if m.group(2):
                        end = int(m.group(2))
                elif m.group(2):
                    start = max(0, size - int(m.group(2)))
                if start >= size or start > end:
                    self.send_response(416)
                    self.send_header("Content-Range", "bytes */%d" % size)
                    self.end_headers()
                    return
                end = min(end, size - 1)
                status = 206

        length = end - start + 1
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(length))
        self.send_header("Accept-Ranges", "bytes")
        if status == 206:
            self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.end_headers()
        if head:
            return
        with open(full, "rb") as fh:
            fh.seek(start)
            remaining = length
            while remaining > 0:
                chunk = fh.read(min(65536, remaining))
                if not chunk:
                    break
                self.wfile.write(chunk)
                remaining -= len(chunk)


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8124
    print("http://127.0.0.1:%d/  (con soporte de Range)" % port)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
