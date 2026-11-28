"""The "You did it!" screen at the end of a quiz game (specs/kit.md, finish screen): it hides the finished game,
the friends arrive one after another, and they sit in tidy rows (5 + 5, or one row of 10 when the card is very wide, as
in Safari on its side), sized to fill the card."""
import pytest

from helpers import LETTER_OF

SIZES = {"ipad-portrait": (1024, 1366), "ipad-landscape": (1366, 1024), "safari-landscape": (1080, 740), "phone": (390, 844)}


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


# One row of 10 only in a very wide card (at least 1.7 times as wide as tall): Note Flash in Safari on its side.
# Who Lives Here's card is not that wide there, so it keeps 5 + 5.
@pytest.mark.parametrize("game,size,per_row", [
    (g, s, 5) for g in GAMES for s in ("phone", "ipad-portrait", "ipad-landscape")] + [("note-flash", "safari-landscape", 10)])
def test_the_friends_sit_in_tidy_rows(browser_setup, base_url, size, per_row, game):
    # Counter-example: the old wrapping row, which put 8 friends on the first line and 2 on the next on a phone;
    # or one row of 10 in an iPad card, where 5 + 5 lets the friends be about twice as big.
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


@pytest.mark.parametrize("size", ["ipad-portrait", "ipad-landscape"])
@pytest.mark.parametrize("game", GAMES)
def test_on_an_ipad_the_celebration_fills_the_card(browser_setup, base_url, size, game):
    # Counter-example: the old fixed sizes (friends at most 54px, title at most 48px), which sat small in the
    # middle of a big empty card; or sizes so big the buttons fall out of the card and the page scrolls.
    context, page = open_finish(browser_setup, base_url, size, game)
    try:
        page.wait_for_timeout(1600)  # after the entrance
        friend = page.locator("#finishRow > * >> nth=0").bounding_box()
        assert friend["height"] >= 100, f"friends are {friend['height']:.0f}px tall; on an iPad they fill the card"
        title = page.evaluate("parseFloat(getComputedStyle(document.querySelector('#finish h2')).fontSize)")
        assert title >= 72, f"the title is {title:.0f}px"
        card = page.locator("#finish").bounding_box()
        parts = page.locator("#finish h2, #finishRow > *, #finish p, #finish .btn").evaluate_all(
            "els => els.filter(e => e.offsetParent !== null).map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom] })")
        out = [b for b in parts if b[0] < card["x"] - 1 or b[1] < card["y"] - 1
               or b[2] > card["x"] + card["width"] + 1 or b[3] > card["y"] + card["height"] + 1]
        assert not out, f"{len(out)} part(s) of the celebration spill out of the card"
        assert page.evaluate("document.documentElement.scrollHeight <= innerHeight + 1"), "the page scrolls"
    finally:
        context.close()
