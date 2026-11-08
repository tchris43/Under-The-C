"""A kid never has to scroll during a game (specs/kit.md): on an iPad, in Safari or from the home screen.

At each size: start the game, then the whole page fits the window (it can't scroll) and the bottom of the
last answer button is inside the window. The setup screen is for the teacher and may scroll.
Sizes are the visible area: Safari loses height to its address and tab bars; the home-screen app does not.
"""
import pytest

SIZES = {
    "safari-landscape": {"width": 1080, "height": 740},
    "safari-portrait": {"width": 810, "height": 1000},
    "home-screen-landscape": {"width": 1080, "height": 810},
    "home-screen-portrait": {"width": 810, "height": 1080},
}


def note_flash(page, base_url, mode):
    page.goto(base_url + "note-flash/")
    page.click('#handSeg button[data-v="both"]')  # the widest piano: all twelve keys
    page.click(f'#modeSeg button[data-v="{mode}"]')
    page.click("#playBtn")
    page.wait_for_selector('#stage[data-phase="ask"]')
    return "#pad .lk" if mode == "pad" else "#piano .pk"


def who_lives_here(page, base_url, level):
    page.goto(base_url + "who-lives-here/")
    page.click(f'#levelSeg button[data-v="{level}"]')
    page.click("#playBtn")
    page.wait_for_selector('#stage[data-phase="id"]')
    if level == "2":  # name both friends, then the Step / Skip cards are the answers
        for _ in range(2):
            page.wait_for_selector('#stage[data-phase="id"]')
            page.click(f'.choice[data-i="{page.get_attribute("#stage", "data-target")}"]')
        page.wait_for_selector('#stage[data-phase="interval"]')
        return ".choice.int"
    return ".choice"


def under_the_sea(page, base_url):
    page.goto(base_url + "under-the-sea/")
    page.wait_for_selector("#piano .pk, #piano button")
    return "#piano button"


GAMES = {
    "note-flash-letters": lambda pg, url: note_flash(pg, url, "pad"),
    "note-flash-piano": lambda pg, url: note_flash(pg, url, "piano"),
    "who-lives-here-level-1": lambda pg, url: who_lives_here(pg, url, "1"),
    "who-lives-here-level-2": lambda pg, url: who_lives_here(pg, url, "2"),
    "under-the-sea": under_the_sea,
}


@pytest.mark.parametrize("game", GAMES)
@pytest.mark.parametrize("size", SIZES)
def test_a_game_fits_the_ipad_without_scrolling(browser_setup, base_url, size, game):
    browser, _ = browser_setup
    context = browser.new_context(viewport=SIZES[size], has_touch=True)
    page = context.new_page()
    try:
        answers = GAMES[game](page, base_url)
        page.wait_for_timeout(300)
        window = page.evaluate("innerHeight")
        page_height = page.evaluate("document.documentElement.scrollHeight")
        bottom = page.evaluate(f"""Math.max(...[...document.querySelectorAll('{answers}')]
            .filter(el => el.offsetParent !== null).map(el => el.getBoundingClientRect().bottom))""")
        assert bottom <= window, f"the last answer button ends at {bottom:.0f}px, below the window ({window}px)"
        assert page_height <= window + 1, f"the page is {page_height}px tall in a {window}px window, so it scrolls"
    finally:
        context.close()


def last_answer_bottom(page, answers):
    return page.evaluate(f"""Math.max(...[...document.querySelectorAll('{answers}')]
        .filter(el => el.offsetParent !== null).map(el => el.getBoundingClientRect().bottom))""")


@pytest.mark.parametrize("game", ["note-flash-piano", "who-lives-here-level-1", "under-the-sea"])
def test_turning_the_ipad_mid_round_keeps_the_round_and_still_fits(browser_setup, base_url, game):
    browser, _ = browser_setup
    context = browser.new_context(viewport=SIZES["safari-portrait"], has_touch=True)
    page = context.new_page()
    try:
        answers = GAMES[game](page, base_url)
        before = page.get_attribute("#stage", "data-target") if game != "under-the-sea" else None
        for size in ("safari-landscape", "safari-portrait"):
            page.set_viewport_size(SIZES[size])
            page.wait_for_timeout(300)
            window = page.evaluate("innerHeight")
            assert last_answer_bottom(page, answers) <= window, f"{size}: answers below the window"
            assert page.evaluate("document.documentElement.scrollHeight") <= window + 1, f"{size}: the page scrolls"
            if before is not None:
                assert page.get_attribute("#stage", "data-target") == before, "turning the iPad never changes the note"
    finally:
        context.close()


@pytest.mark.parametrize("game", ["note-flash-piano", "who-lives-here-level-1", "under-the-sea"])
@pytest.mark.parametrize("size", ["safari-landscape", "safari-portrait"])
def test_the_update_note_never_covers_an_answer(browser_setup, base_url, size, game):
    browser, _ = browser_setup
    context = browser.new_context(viewport=SIZES[size], has_touch=True)
    page = context.new_page()
    try:
        page.goto(base_url + "note-flash/")
        if not page.evaluate("'serviceWorker' in navigator"):
            pytest.skip("this test browser has no service worker support")
        page.wait_for_function("navigator.serviceWorker.ready.then(() => true)")
        answers = GAMES[game](page, base_url)  # this load is controlled by the offline helper
        page.wait_for_function("navigator.serviceWorker.controller !== null")
        page.evaluate("navigator.serviceWorker.dispatchEvent(new Event('controllerchange'))")  # a new version arrived
        note = page.locator("#updateNote")
        assert note.is_visible()
        n = note.bounding_box()
        covered = page.evaluate("""([sel, n]) => [...document.querySelectorAll(sel)].filter(el => el.offsetParent !== null)
            .map(el => el.getBoundingClientRect())
            .filter(r => r.left < n.x + n.width && r.right > n.x && r.top < n.y + n.height && r.bottom > n.y).length""", [answers, n])
        assert covered == 0, f"the update note covers {covered} answer button(s)"
        header = page.locator(".top").bounding_box()
        assert n["y"] >= header["y"] and n["y"] + n["height"] <= header["y"] + header["height"] + 1, "the note sits in the header row"
        assert page.evaluate("document.documentElement.scrollHeight") <= page.evaluate("innerHeight") + 1
    finally:
        context.close()
