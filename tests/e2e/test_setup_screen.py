"""The shared setup screen inside the games: fixes from the kid-QA review (spec kit.md 30-35)."""
import pytest

from helpers import LETTER_OF, clean


def play_who(page, base_url):
    page.goto(base_url + "who-lives-here/")
    page.click("#playBtn")
    page.wait_for_selector('#stage[data-phase="id"]')


def answer_who(page):
    page.wait_for_selector('#stage[data-phase="id"]')
    page.click(f'.choice[data-i="{page.get_attribute("#stage", "data-target")}"]')


# 1. A friend still flying when setup opens never lands on the next game.
def test_a_flying_friend_never_lands_on_the_next_game(page, base_url):
    play_who(page, base_url)
    answer_who(page)
    page.click("#settingsBtn")
    assert page.locator(".flyer").count() == 0, "no friend flies across the setup screen"
    page.click('#handSeg button[data-v="both"]')  # a change, so Play starts a new game
    page.click("#playBtn")
    page.wait_for_timeout(900)  # longer than the flight
    assert page.locator("#revealG > *").count() == 0, "the new note is not already answered"
    assert page.get_attribute("#note0", "opacity") in (None, "1")
    assert page.locator("#ask").inner_text() == "Who lives here?"
    clean(page)


# 2. The settings button never throws away a game in progress by accident.
@pytest.mark.parametrize("game", ["who", "flash"])
def test_back_to_game_keeps_the_progress(page, base_url, game):
    if game == "who":
        play_who(page, base_url)
        for _ in range(2):
            answer_who(page)
            page.wait_for_timeout(2500)
    else:
        page.goto(base_url + "note-flash/")
        page.click("#playBtn")
        for _ in range(2):
            page.wait_for_selector('#stage[data-phase="ask"]')
            page.keyboard.press(LETTER_OF[int(page.get_attribute("#stage", "data-target"))].lower())
            page.wait_for_timeout(1900)
    page.wait_for_selector(".slot.filled >> nth=1")
    page.click("#settingsBtn")
    page.click("#backBtn")
    assert page.locator("#setup").is_hidden()
    assert page.locator(".slot.filled").count() == 2
    page.click("#settingsBtn")
    page.click("#playBtn")  # nothing changed: Play goes back to the same game
    assert page.locator(".slot.filled").count() == 2
    page.click("#settingsBtn")
    page.click('#handSeg button[data-v="both"]')
    page.click("#playBtn")  # something changed: a fresh game
    assert page.locator(".slot.filled").count() == 0
    assert page.locator("#count").inner_text() == "1 / 10"
    clean(page)


def test_no_back_button_before_a_game_has_started(page, base_url):
    page.goto(base_url + "who-lives-here/")
    assert page.locator("#backBtn").is_hidden()


# 3. On a phone, the Level choices stay two neat buttons on one row.
def test_level_buttons_fit_a_phone(phone, base_url):
    phone.goto(base_url + "who-lives-here/")
    boxes = [phone.locator(f'#levelSeg button[data-v="{v}"]').bounding_box() for v in ("1", "2")]
    assert abs(boxes[0]["y"] - boxes[1]["y"]) < 2, "both levels on one row"
    assert all(b["height"] < 56 for b in boxes), "no wrapped labels"


# 4. On a phone, the settings button stays in the header row, not on a row of its own.
@pytest.mark.parametrize("path", ["who-lives-here/", "note-flash/"])
def test_settings_button_shares_the_header_row_on_a_phone(phone, base_url, path):
    phone.goto(base_url + path)
    phone.click("#playBtn")
    gear, home = phone.locator("#settingsBtn").bounding_box(), phone.locator("a.btn.home").bounding_box()
    assert gear["y"] < home["y"] + home["height"], "gear is beside the Games button, not below it"


# 5. On an iPad the twelve friends sit in two even rows of six (not 11 + 1, which left G alone on a row).
@pytest.mark.parametrize("size", [(1024, 1366), (810, 1000), (1366, 1024), (1080, 740)],
                         ids=["ipad-portrait", "safari-portrait", "ipad-landscape", "safari-landscape"])
def test_the_friends_sit_in_two_even_rows_on_an_ipad(browser_setup, base_url, size):
    # Counter-example: the old auto-fill grid, which wrapped 11 + 1 in iPad portrait and 12 in one row in landscape.
    browser, _ = browser_setup
    context = browser.new_context(viewport={"width": size[0], "height": size[1]}, has_touch=True)
    page = context.new_page()
    try:
        page.goto(base_url + "who-lives-here/")
        tops = page.locator("#friends .fr").evaluate_all("els => els.map(e => Math.round(e.getBoundingClientRect().top))")
        rows = {}
        for t in tops:
            rows[t] = rows.get(t, 0) + 1
        assert list(rows.values()) == [6, 6], f"rows of 6 + 6, got {list(rows.values())}"
    finally:
        context.close()
