"""Offline play: after one visit, every game opens and plays with the internet off."""
import pytest

from helpers import PAGES, clean


@pytest.fixture(autouse=True)
def _chromium_only(browser_setup):
    browser, _ = browser_setup
    if browser.browser_type.name == "webkit":
        pytest.skip("Playwright's Linux WebKit build can't run service workers; check offline play on a real iPad")


def test_games_work_offline_after_one_visit(page, base_url, browser_setup):
    page.goto(base_url)
    if not page.evaluate("'serviceWorker' in navigator"):
        pytest.skip("this test browser has no service worker support")
    page.evaluate("navigator.serviceWorker.ready.then(() => true)")
    page.wait_for_function("navigator.serviceWorker.controller !== null || caches.keys().then(k => k.length > 0)")
    page.reload()  # now controlled by the offline helper
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    page.context.set_offline(True)
    try:
        for path in PAGES:
            page.goto(base_url + path)
            assert page.locator("h1").inner_text() in ("Under the C", "Under the Sea", "Who Lives Here?", "Note Flash")
        # and a game still plays
        page.goto(base_url + "note-flash/")
        page.click("#playBtn")
        t = int(page.get_attribute("#stage", "data-target"))
        page.click(f'.lk[data-l="{"CDEFGABCDEFG"[t]}"]')
        page.wait_for_selector(".slot.filled")
    finally:
        page.context.set_offline(False)
    clean(page)


def test_home_page_explains_how_to_install(page, base_url):
    page.goto(base_url)
    assert "Add to Home Screen" in page.locator("#install").inner_text()
    manifest = page.evaluate("fetch('manifest.webmanifest').then(r => r.json())")
    assert manifest["name"] == "Under the C"


def test_an_update_shows_a_note_instead_of_reloading_mid_game(page, base_url):
    page.goto(base_url + "note-flash/")
    if not page.evaluate("'serviceWorker' in navigator"):
        pytest.skip("this test browser has no service worker support")
    page.wait_for_function("navigator.serviceWorker.controller !== null || navigator.serviceWorker.ready.then(() => false)")
    page.reload()
    page.wait_for_function("navigator.serviceWorker.controller !== null")
    page.click("#playBtn")
    before = page.get_attribute("#stage", "data-target")
    # Simulate the moment a newly deployed version takes over
    page.evaluate("navigator.serviceWorker.dispatchEvent(new Event('controllerchange'))")
    note = page.locator("#updateNote")
    assert note.is_visible()
    assert "New games are ready" in note.inner_text()
    assert page.get_attribute("#stage", "data-target") == before, "the game did not reload by itself"
    note.locator("button").click()
    page.wait_for_load_state("load")
    assert not page.locator("#updateNote").is_visible()
    clean(page)


def test_first_visit_shows_no_update_note(page, base_url):
    page.goto(base_url)
    page.wait_for_timeout(500)
    assert page.locator("#updateNote").count() == 0
