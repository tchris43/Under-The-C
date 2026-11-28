"""Under the Sea: meet the friends, both hands."""
import pytest

from helpers import clean


def test_opens_on_the_sea_friends_with_their_piano_keys(page, base_url):
    page.goto(base_url + "under-the-sea/")
    assert page.locator("#world .char").count() == 8  # seven sea friends + Charlie Cat
    assert page.locator("#piano .wkey").count() == 8
    clean(page)


def test_tapping_a_friend_shows_its_story(page, base_url):
    page.goto(base_url + "under-the-sea/")
    page.click('#world .char[data-i="3"]')
    assert page.locator("#cardName").inner_text() == "Finn Flounder"
    assert page.locator("#cardLetter").inner_text() == "F"
    assert "between the two dots" in page.locator("#cardStory").inner_text()
    assert page.locator("#hint").get_attribute("class").endswith("gone")


def test_piano_key_selects_its_friend(page, base_url):
    page.goto(base_url + "under-the-sea/")
    page.click('#piano .wkey[data-i="0"]')
    assert page.locator("#cardName").inner_text() == "Coco Clownfish"


def test_sections_show_the_right_friends(page, base_url):
    page.goto(base_url + "under-the-sea/")
    page.click('#sectionSeg button[data-v="right"]')
    assert page.locator("#world .char").count() == 5
    assert page.locator("#piano .wkey").count() == 5
    page.click('#sectionSeg button[data-v="all"]')
    assert page.locator("#world .char").count() == 12
    assert page.locator("#piano .wkey").count() == 12


def test_laptop_arrow_keys_walk_through_the_friends(page, base_url):
    page.goto(base_url + "under-the-sea/")
    page.keyboard.press("ArrowLeft")  # from middle C down to B
    assert page.locator("#cardName").inner_text() == "Benny Blobfish"


def test_parade_visits_every_friend_and_ends(page, base_url):
    page.goto(base_url + "under-the-sea/")
    page.click("#paradeBtn")
    page.wait_for_timeout(8 * 420 + 400)
    assert page.locator("#paradeBtn").is_enabled()
    assert page.locator("#cardName").inner_text() == "Charlie Cat"  # the parade ends at the top, middle C
    clean(page)


# A chosen friend and the glow round it are never cut off by the edge of the scene (Charlie Cat sits at the far right).
SIZES = {"ipad-portrait": (1024, 1366), "ipad-landscape": (1366, 1024), "safari-landscape": (1080, 740), "phone": (390, 844)}


@pytest.mark.parametrize("section", ["sea", "right", "all"])
@pytest.mark.parametrize("size", SIZES)
def test_a_chosen_friends_glow_is_never_cut_off(browser_setup, base_url, size, section):
    browser, _ = browser_setup
    w, h = SIZES[size]
    context = browser.new_context(viewport={"width": w, "height": h}, has_touch=True)
    page = context.new_page()
    try:
        page.goto(base_url + "under-the-sea/")
        page.click(f'#sectionSeg button[data-v="{section}"]')
        ids = page.locator("#world .char").evaluate_all("els => els.map(e => e.dataset.i)")
        for i in (ids[0], "7", ids[-1]):  # the friends at both ends, and Charlie Cat
            page.click(f'#world .char[data-i="{i}"]')
            page.wait_for_timeout(250)
            ring = page.locator(f'#world .char[data-i="{i}"]').bounding_box()  # the friend, its whiskers and its glow
            scene = page.locator("#scene").bounding_box()
            border = 3  # the scene's own outline
            assert ring["x"] >= scene["x"] + border - 0.5, f"friend {i}: glow cut off on the left"
            assert ring["y"] >= scene["y"] + border - 0.5, f"friend {i}: glow cut off at the top"
            assert ring["x"] + ring["width"] <= scene["x"] + scene["width"] - border + 0.5, f"friend {i}: glow cut off on the right"
            assert ring["y"] + ring["height"] <= scene["y"] + scene["height"] - border + 0.5, f"friend {i}: glow cut off at the bottom"
    finally:
        context.close()


# The chosen friend's piano key stays softly lit (class "chosen") until another friend or key is chosen,
# whether the friend or the key was tapped.
# Counter-example: the old 0.22-second flash (the key goes out after 400ms), or two keys left lit after a new choice.
@pytest.mark.parametrize("tap", ["friend", "key"])
def test_the_chosen_friends_key_stays_lit_until_the_next_choice(browser_setup, base_url, tap):
    browser, _ = browser_setup
    context = browser.new_context(viewport={"width": 1024, "height": 1366}, has_touch=True)
    page = context.new_page()
    target = (lambda i: f'#world .char[data-i="{i}"]') if tap == "friend" else (lambda i: f'#piano .wkey[data-i="{i}"]')
    lit = lambda: page.locator("#piano .wkey.chosen").evaluate_all("els => els.map(e => e.dataset.i)")
    try:
        page.goto(base_url + "under-the-sea/")
        page.tap(target(3))  # Finn Flounder's F
        assert lit() == ["3"], "the key lights up, and only that key"
        page.wait_for_timeout(1000)
        assert lit() == ["3"], "and stays lit"
        page.tap(target(5))  # Annie Anemone's A
        assert lit() == ["5"], "until another friend is chosen"
    finally:
        context.close()


# iPad held upright: the scene is tall, so the staff and friends grow into the sky instead of leaving it empty.
# Counter-example: the old layout, which kept the drawing 1000 units wide (sea friends about 79px across, right-hand
# friends about 79px, everyone about 65px). Fitting on one screen is checked in test_no_scroll.py.
@pytest.mark.parametrize("section,least", [("sea", 100), ("right", 100), ("all", 72)])
def test_on_an_upright_ipad_the_friends_grow_into_the_sky(browser_setup, base_url, section, least):
    browser, _ = browser_setup
    context = browser.new_context(viewport={"width": 1024, "height": 1366}, has_touch=True)
    page = context.new_page()
    try:
        page.goto(base_url + "under-the-sea/")
        page.click(f'#sectionSeg button[data-v="{section}"]')
        page.wait_for_timeout(200)
        sizes = page.locator("#world .char .ring").evaluate_all("els => els.map(e => e.getBoundingClientRect().width)")
        assert min(sizes) >= least, f"friends are {min(sizes):.0f}px across (their glow); at least {least}px"
    finally:
        context.close()
