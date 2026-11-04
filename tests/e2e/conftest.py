"""Shared fixtures: serve site/ locally and open it in each browser under test.

BROWSERS=chromium,webkit  (default: chromium). webkit runs as an iPad Pro 11 with touch, the closest
thing to the studio's iPads. CI runs both; locally chromium alone is fine.
"""
import functools
import http.server
import os
import socketserver
import threading
from pathlib import Path

import pytest
from playwright.sync_api import sync_playwright

SITE = Path(__file__).resolve().parents[2] / "site"
BROWSERS = [b.strip() for b in os.environ.get("BROWSERS", "chromium").split(",") if b.strip()]


class _QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


@pytest.fixture(scope="session")
def base_url():
    handler = functools.partial(_QuietHandler, directory=str(SITE))
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    httpd.daemon_threads = True
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    yield f"http://127.0.0.1:{httpd.server_address[1]}/"
    httpd.shutdown()


@pytest.fixture(scope="session")
def pw():
    with sync_playwright() as p:
        yield p


@pytest.fixture(scope="session", params=BROWSERS)
def browser_setup(request, pw):
    """(browser, context options) for each browser under test."""
    name = request.param
    browser = getattr(pw, name).launch()
    if name == "webkit":
        options = dict(pw.devices["iPad Pro 11"])
        options.pop("default_browser_type", None)
    else:
        options = {"viewport": {"width": 1100, "height": 1200}}
    yield browser, options
    browser.close()


@pytest.fixture
def page(browser_setup, base_url):
    """A fresh page that records console errors, page errors and any request that leaves the site."""
    browser, options = browser_setup
    context = browser.new_context(**options)
    pg = context.new_page()
    pg.problems = []
    pg.outside_requests = []
    pg.on("pageerror", lambda e: pg.problems.append(f"page error: {e}"))
    pg.on("console", lambda m: pg.problems.append(f"console error: {m.text}") if m.type == "error" else None)
    pg.on("request", lambda r: None if r.url.startswith((base_url, "data:", "blob:")) else pg.outside_requests.append(r.url))
    yield pg
    context.close()


@pytest.fixture
def phone(browser_setup, base_url):
    """The same browser at phone size."""
    browser, _ = browser_setup
    context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True)
    pg = context.new_page()
    yield pg
    context.close()
