"""Note Flash (Level 3): set up practice first, then name the note with the Letter Pad or on the Piano Keys."""
from helpers import LETTER_OF, LEFT, clean


def target(page):
    return int(page.get_attribute("#stage", "data-target"))


def start(page, base_url, query=""):
    """Open Note Flash and press Play on the setup screen with this device's last choices."""
    page.goto(base_url + "note-flash/" + query)
    page.click("#playBtn")
    page.wait_for_selector('#stage[data-phase="ask"]')


# ---------- Shared setup screen (its rules are unit tests in tests/unit/settings.test.js) ----------

def test_setup_appears_first(page, base_url):
    page.goto(base_url + "note-flash/")
    assert page.locator("#setup").is_visible()
    assert page.locator("#game").is_hidden()
    assert page.locator("#settingsBtn").is_hidden()
    page.keyboard.press("c")  # typing on the setup screen never answers
    assert page.locator("#setup").is_visible()
    clean(page)


def test_play_starts_the_game_with_no_settings_buttons_on_screen(page, base_url):
    start(page, base_url)
    assert page.locator("#setup").is_hidden()
    assert page.locator("#pad").is_visible()
    for sel in ("#handSeg", "#modeSeg", "#lettersSeg", "#friends"):
        assert page.locator(sel).is_hidden(), sel
    assert page.locator("#settingsBtn").is_visible()


def test_only_the_chosen_friends_come_up(page, base_url):
    page.goto(base_url + "note-flash/")
    page.click('#handSeg button[data-v="left"]')
    for i in (0, 3, 4, 5, 6):  # leave Daisy D, Eddie E and Charlie C
        page.click(f'.fr[data-i="{i}"]')
    page.click("#playBtn")
    seen = set()
    for _ in range(10):
        page.wait_for_selector('#stage[data-phase="ask"]')
        t = target(page)
        seen.add(t)
        page.keyboard.press(LETTER_OF[t].lower())
    page.wait_for_selector("#finish:not([hidden])", timeout=5000)
    assert seen <= {1, 2, 7}
    clean(page)


def test_settings_icon_reopens_setup_and_a_change_starts_fresh(page, base_url):
    start(page, base_url)
    page.keyboard.press(LETTER_OF[target(page)].lower())
    page.wait_for_selector(".slot.filled")
    page.click("#settingsBtn")
    assert page.locator("#setup").is_visible()
    assert page.locator("#game").is_hidden()
    page.click('#handSeg button[data-v="both"]')  # with no change, Play goes back instead (test_setup_screen.py)
    page.click("#playBtn")
    assert page.locator(".slot.filled").count() == 0
    assert page.locator("#count").inner_text() == "1 / 10"


# ---------- Playing ----------

def test_letter_pad_right_answer_shows_the_friend_on_the_note(page, base_url):
    start(page, base_url)
    t = target(page)
    page.click(f'.lk[data-l="{LETTER_OF[t]}"]')
    assert page.locator("#revealG svg, #revealG g").count() > 0
    assert page.locator("#ask").inner_text().startswith(LETTER_OF[t] + "!")
    page.wait_for_selector(".slot.filled .star")
    clean(page)


def test_two_misses_bring_a_hint(page, base_url):
    start(page, base_url)
    right = LETTER_OF[target(page)]
    wrong = [l for l in "CDEFGAB" if l != right][:2]
    page.click(f'.lk[data-l="{wrong[0]}"]')
    assert page.locator("#ask").inner_text() == "Try again!"
    page.click(f'.lk[data-l="{wrong[1]}"]')
    assert "hint" in page.locator("#ask").inner_text()
    assert float(page.get_attribute("#ghostG", "opacity")) > 0


def test_a_full_game_ends_with_a_celebration(page, base_url):
    start(page, base_url)
    seen = []
    for _ in range(10):
        page.wait_for_selector('#stage[data-phase="ask"]')
        t = target(page)
        seen.append(t)
        page.keyboard.press(LETTER_OF[t].lower())
    page.wait_for_selector("#finish:not([hidden])", timeout=5000)
    assert set(seen) <= LEFT
    assert page.locator(".slot.filled").count() == 10


def test_piano_keys_mode_needs_the_exact_key(page, base_url):
    page.goto(base_url + "note-flash/")
    page.click('#modeSeg button[data-v="piano"]')  # remembered on this device when Play is pressed
    page.click("#playBtn")
    assert page.locator("#pad").is_hidden()
    assert page.locator("#piano .pk").count() == 8
    for seed in range(1, 200):
        start(page, base_url, f"?seed={seed}")
        t = target(page)
        if LETTER_OF[t] == "C":
            other = 7 if t == 0 else 0
            page.click(f'.pk[data-i="{other}"]')
            assert page.locator("#ask").inner_text() == "Right letter! Find the other C."
            page.click(f'.pk[data-i="{t}"]')
            assert "ok" in page.locator(f'.pk[data-i="{t}"]').get_attribute("class").split()
            clean(page)
            return
    raise AssertionError("no seed from 1 to 199 starts on a C")


def test_letters_on_the_keys_can_be_hidden(page, base_url):
    page.goto(base_url + "note-flash/")
    page.click('#modeSeg button[data-v="piano"]')
    page.click('#lettersSeg button[data-v="off"]')
    page.click("#playBtn")
    assert "hide-letters" in page.get_attribute("#piano", "class")
    assert not page.locator("#piano .pk .nl").first.is_visible()
