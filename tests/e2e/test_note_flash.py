"""Note Flash (Level 3): name the note with the Letter Pad or on the Piano Keys."""
from helpers import LETTER_OF, LEFT, clean


def target(page):
    return int(page.get_attribute("#stage", "data-target"))


def test_letter_pad_right_answer_shows_the_friend_on_the_note(page, base_url):
    page.goto(base_url + "note-flash/")
    t = target(page)
    page.click(f'.lk[data-l="{LETTER_OF[t]}"]')
    assert page.locator("#revealG svg, #revealG g").count() > 0
    assert page.locator("#ask").inner_text().startswith(LETTER_OF[t] + "!")
    page.wait_for_selector(".slot.filled .star")
    clean(page)


def test_two_misses_bring_a_hint(page, base_url):
    page.goto(base_url + "note-flash/")
    right = LETTER_OF[target(page)]
    wrong = [l for l in "CDEFGAB" if l != right][:2]
    page.click(f'.lk[data-l="{wrong[0]}"]')
    assert page.locator("#ask").inner_text() == "Try again!"
    page.click(f'.lk[data-l="{wrong[1]}"]')
    assert "hint" in page.locator("#ask").inner_text()
    assert float(page.get_attribute("#ghostG", "opacity")) > 0


def test_a_full_game_ends_with_a_celebration(page, base_url):
    page.goto(base_url + "note-flash/")
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
    page.click('#modeSeg button[data-v="piano"]')  # remembered on this device for the next loads
    assert page.locator("#pad").is_hidden()
    assert page.locator("#piano .pk").count() == 8
    for seed in range(1, 200):
        page.goto(base_url + f"note-flash/?seed={seed}")
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
    assert "hide-letters" in page.get_attribute("#piano", "class")
    assert not page.locator("#piano .pk .nl").first.is_visible()
