"""Under the Sea: meet the friends, both hands."""
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
