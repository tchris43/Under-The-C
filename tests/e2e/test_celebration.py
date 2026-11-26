"""The "You did it!" screen at the end of a quiz game (specs/kit.md, finish screen): it hides the finished game,
the friends arrive one after another, and they sit in tidy rows (5 + 5 on a phone, one row of 10 on an iPad)."""
import pytest

from helpers import LETTER_OF

SIZES = {"ipad-portrait": (1024, 1366), "ipad-landscape": (1366, 1024), "phone": (390, 844)}


def finish_who(page, base_url):
    page.goto(base_url + "who-lives-here/")
    page.click("#playBtn")
    for _ in range(10):
        page.wait_for_selector('#stage[data-phase="id"]')
        page.click(f'.choice[data-i="{page.get_attribute("#stage", "data-target")}"]')
    page.wait_for_selector("#finish:not([hidden])", timeout=8000)


def finish_flash(page, base_url):
    page.goto(base_url + "note-flash/")
    page.click("#playBtn")
    for _ in range(10):
        page.wait_for_selector('#stage[data-phase="ask"]')
        page.keyboard.press(LETTER_OF[int(page.get_attribute("#stage", "data-target"))].lower())
    page.wait_for_selector("#finish:not([hidden])", timeout=8000)


GAMES = {"who-lives-here": finish_who, "note-flash": finish_flash}


def open_finish(browser_setup, base_url, size, game):
    browser, _ = browser_setup
    w, h = SIZES[size]
    context = browser.new_context(viewport={"width": w, "height": h}, has_touch=True)
    page = context.new_page()
    GAMES[game](page, base_url)
    return context, page


@pytest.mark.parametrize("game", GAMES)
def test_the_finished_game_is_hidden_behind_the_celebration(browser_setup, base_url, game):
    # Counter-example: the old see-through panel (96% opaque) lets "Yes! Annie Anemone!" and the clefs show through.
    context, page = open_finish(browser_setup, base_url, "ipad-portrait", game)
    try:
        # Browsers report a mixed colour as rgba(r, g, b, a) or color(srgb r g b / a); a missing alpha means opaque.
        alpha = page.evaluate("""(() => { const c = getComputedStyle(document.querySelector('#finish')).backgroundColor;
            const slash = c.match(/\\/\\s*([\\d.]+)\\s*\\)$/); if (slash) return parseFloat(slash[1]);
            const rgba = c.match(/^rgba\\([^,]+,[^,]+,[^,]+,\\s*([\\d.]+)\\)$/); return rgba ? parseFloat(rgba[1]) : 1 })()""")
        assert alpha == 1, f"the celebration is see-through (alpha {alpha})"
        hidden = page.evaluate("""['#ask', '#hearBtn', '#staff'].map(s => {
            const r = document.querySelector(s).getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
            return document.elementFromPoint(x, y)?.closest('#finish') !== null })""")
        assert hidden == [True, True, True], "the question, the Hear button and the staff are all behind the celebration"
        # The answers below the card are part of the finished game too (Note Flash keeps its last key lit otherwise).
        answers = page.locator("#answerArea, #choices").evaluate_all(
            "els => els.map(e => e.checkVisibility({ visibilityProperty: true }) && e.querySelector('button') !== null)")
        assert not any(answers), "no answer buttons show under the celebration"
        # The card keeps its dark outline: its left edge is still the card, not the celebration on top of it.
        edge = page.evaluate("""(() => { const r = document.querySelector('#stage .sheet').getBoundingClientRect();
            return document.elementFromPoint(r.left + 1.5, r.top + r.height / 2)?.closest('#finish') === null })()""")
        assert edge, "the celebration covers the card's outline"
    finally:
        context.close()


@pytest.mark.parametrize("game", GAMES)
def test_the_friends_arrive_one_after_another(browser_setup, base_url, game):
    # Counter-example: no animation, or every friend appearing at once (the same delay for all).
    context, page = open_finish(browser_setup, base_url, "ipad-portrait", game)
    try:
        anim = page.locator("#finishRow > *").evaluate_all(
            "els => els.map(e => [getComputedStyle(e).animationName, parseFloat(getComputedStyle(e).animationDelay)])")
        assert len(anim) == 10
        assert all(name != "none" for name, _ in anim), "every friend has an entrance"
        delays = [d for _, d in anim]
        assert delays == sorted(delays) and delays[-1] > delays[0], "they arrive one after another, left to right"
        assert page.evaluate("getComputedStyle(document.querySelector('#finish h2')).animationName") != "none", "the title pops in"
    finally:
        context.close()


@pytest.mark.parametrize("size,per_row", [("phone", 5), ("ipad-portrait", 10), ("ipad-landscape", 10)])
@pytest.mark.parametrize("game", GAMES)
def test_the_friends_sit_in_tidy_rows(browser_setup, base_url, size, per_row, game):
    # Counter-example: the old wrapping row, which put 8 friends on the first line and 2 on the next on a phone.
    context, page = open_finish(browser_setup, base_url, size, game)
    try:
        page.wait_for_timeout(1600)  # after the entrance
        tops = page.locator("#finishRow > *").evaluate_all("els => els.map(e => Math.round(e.getBoundingClientRect().top))")
        rows = {}
        for t in tops:
            rows[t] = rows.get(t, 0) + 1
        assert sorted(rows.values()) == [per_row] * (10 // per_row), f"rows of {per_row}, got {list(rows.values())}"
        w = page.evaluate("innerWidth")
        right = page.locator("#finishRow > *").evaluate_all("els => Math.max(...els.map(e => e.getBoundingClientRect().right))")
        assert right <= w, "every friend is on screen"
    finally:
        context.close()


@pytest.mark.parametrize("game", GAMES)
def test_with_reduced_motion_the_celebration_is_simply_there(browser_setup, base_url, game):
    # Counter-example: an entrance that ignores "reduce motion", or friends left invisible when the animation is off.
    browser, _ = browser_setup
    context = browser.new_context(viewport={"width": 390, "height": 844}, has_touch=True, reduced_motion="reduce")
    page = context.new_page()
    try:
        GAMES[game](page, base_url)
        looks = page.locator("#finish h2, #finishRow > *").evaluate_all(
            "els => els.map(e => [getComputedStyle(e).animationName, getComputedStyle(e).opacity, getComputedStyle(e).transform])")
        assert all(name == "none" for name, _, _ in looks), "no entrance animation"
        assert all(op == "1" and tf == "none" for _, op, tf in looks), "everything is already in place"
    finally:
        context.close()
