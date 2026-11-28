"""The parents page (specs/parents.md). Site-wide promises (no errors, no outside requests, security rules, phone
width, button size) run on it through PAGES in helpers.py."""
import pytest

from helpers import clean

FORM = "https://forms.gle/3yCHtEfHkL5ee5Nr6"


def test_says_what_it_is_and_who_made_it(page, base_url):
    page.goto(base_url + "parents/")
    assert page.locator("h1").inner_text() == "The way a real piano teacher teaches notes: one friend at a time."
    assert "Made by a piano teacher for her students." in page.locator(".by").inner_text()
    clean(page)


def test_shows_a_picture_of_the_games(page, base_url):
    # Counter-example: a missing shot.png (a broken image) or an image with no description.
    page.goto(base_url + "parents/")
    page.wait_for_load_state("networkidle")
    img = page.locator("img.shot")
    assert img.get_attribute("src") == "shot.png"
    assert img.get_attribute("alt"), "the picture is described for screen readers"
    assert img.evaluate("i => i.complete && i.naturalWidth > 0"), "the picture loads"


def test_try_it_free_opens_who_lives_here(page, base_url):
    page.goto(base_url + "parents/")
    link = page.get_by_role("link", name="Try it free")
    assert link.get_attribute("href") == "../who-lives-here/"
    link.click()
    assert page.locator("h1").inner_text() == "Who Lives Here?"
    clean(page)


def test_story_mode_early_link_opens_the_form_in_a_new_tab_and_passes_nothing(page, base_url):
    # Counter-example: a link without rel="noopener noreferrer" (the form could see and reach back to our page),
    # or one that replaces our page instead of opening a new tab.
    page.goto(base_url + "parents/")
    soon = " ".join(page.locator(".soon").text_content().split())  # the words, not their uppercase styling
    for words in ("Coming soon", "Story Mode", "Your child unlocks a new Note Friend for every note they master.",
                  "About $4.99 one-time.", "Want it?"):
        assert words in soon, words
    link = page.get_by_role("link", name="Get the early link")
    assert link.get_attribute("href") == FORM
    assert link.get_attribute("target") == "_blank"
    assert set(link.get_attribute("rel").split()) >= {"noopener", "noreferrer"}
    assert page.outside_requests == [], "nothing is fetched from the form until the button is tapped"


def test_has_the_same_privacy_note_as_the_home_page(page, base_url):
    page.goto(base_url)
    home = page.locator(".privacy").inner_text()
    page.goto(base_url + "parents/")
    assert page.locator(".privacy").inner_text() == home


def test_no_forms_or_text_boxes(page, base_url):
    page.goto(base_url + "parents/")
    assert page.locator("form, input, textarea, select, [contenteditable]").count() == 0


@pytest.mark.parametrize("size", [(1024, 1366), (1366, 1024), (390, 844)], ids=["ipad-portrait", "ipad-landscape", "phone"])
def test_the_headline_and_try_it_free_are_on_the_first_screen(browser_setup, base_url, size):
    # Counter-example: a picture or header so tall that a parent must scroll to find the button.
    browser, _ = browser_setup
    context = browser.new_context(viewport={"width": size[0], "height": size[1]}, has_touch=True)
    pg = context.new_page()
    try:
        pg.goto(base_url + "parents/")
        h = pg.evaluate("innerHeight")
        for loc in (pg.locator("h1"), pg.get_by_role("link", name="Try it free")):
            box = loc.bounding_box()
            assert box["y"] + box["height"] <= h, "visible without scrolling"
    finally:
        context.close()
