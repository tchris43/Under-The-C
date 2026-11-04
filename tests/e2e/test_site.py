"""Site-wide promises: every page loads cleanly, stays on our own site, and fits a phone."""
import pytest

from helpers import PAGES, clean


@pytest.mark.parametrize("path", PAGES)
def test_page_loads_without_errors_or_outside_requests(page, base_url, path):
    page.goto(base_url + path)
    page.wait_for_load_state("networkidle")
    clean(page)


@pytest.mark.parametrize("path", PAGES)
def test_page_locks_down_what_it_can_load(page, base_url, path):
    page.goto(base_url + path)
    csp = page.get_attribute('meta[http-equiv="Content-Security-Policy"]', "content")
    assert "default-src 'self'" in csp
    assert "script-src 'self'" in csp
    assert "object-src 'none'" in csp
    assert page.get_attribute('meta[name="referrer"]', "content") == "no-referrer"


@pytest.mark.parametrize("path", PAGES)
def test_page_fits_a_phone_without_sideways_scrolling(phone, base_url, path):
    phone.goto(base_url + path)
    phone.wait_for_timeout(300)
    assert phone.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1")


@pytest.mark.parametrize("path", PAGES[1:])
def test_buttons_are_big_enough_for_small_fingers(page, base_url, path):
    page.goto(base_url + path)
    page.wait_for_timeout(300)
    small = page.evaluate("""() => [...document.querySelectorAll('button, a.btn, a.game')]
        .filter(el => el.offsetParent !== null && !el.classList.contains('bkey') && !el.classList.contains('bk'))
        .map(el => ({ text: (el.getAttribute('aria-label') || el.textContent).trim(), h: el.getBoundingClientRect().height }))
        .filter(b => b.h < 36)""")
    assert small == [], small


def test_home_page_links_to_every_game(page, base_url):
    page.goto(base_url)
    names = page.locator("a.game .name").all_inner_texts()
    assert names == ["Under the Sea", "Who Lives Here?", "Note Flash"]
    for href, title in [("under-the-sea/", "Under the Sea"), ("who-lives-here/", "Who Lives Here?"), ("note-flash/", "Note Flash")]:
        page.goto(base_url)
        page.click(f'a.game[href="{href}"]')
        assert page.locator("h1").inner_text() == title
        page.click("a.btn.home")
        assert page.locator("h1").inner_text() == "Under the C"
    clean(page)
