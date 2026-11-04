"""Who Lives Here?: Level 1 (name the friend) and Level 2 (two friends, then step or skip)."""
from helpers import LEFT, RIGHT, clean


def answer_animal(page):
    target = page.get_attribute("#stage", "data-target")
    page.click(f'.choice[data-i="{target}"]')
    return int(target)


def test_level_1_left_hand_plays_ten_rounds_of_left_hand_notes(page, base_url):
    page.goto(base_url + "who-lives-here/")
    seen = []
    for _ in range(10):
        page.wait_for_selector('#stage[data-phase="id"]')
        seen.append(answer_animal(page))
    page.wait_for_selector("#finish:not([hidden])", timeout=5000)
    assert set(seen) <= LEFT
    assert all(a != b for a, b in zip(seen, seen[1:])), "no note twice in a row"
    assert page.locator(".slot.filled").count() == 10
    assert page.locator(".slot .star").count() == 10
    assert "Every round right" in page.locator("#finishMsg").inner_text()
    clean(page)


def test_three_different_friends_to_choose_from(page, base_url):
    page.goto(base_url + "who-lives-here/")
    ids = page.locator(".choice").evaluate_all("els => els.map(e => e.dataset.i)")
    assert len(ids) == 3 and len(set(ids)) == 3
    assert page.get_attribute("#stage", "data-target") in ids


def test_a_wrong_pick_is_gentle_and_costs_the_star(page, base_url):
    page.goto(base_url + "who-lives-here/")
    target = page.get_attribute("#stage", "data-target")
    wrong = page.locator(f'.choice:not([data-i="{target}"])').first
    wrong.click()
    assert "Try again" in page.locator("#ask").inner_text()
    assert "no" in wrong.get_attribute("class")
    page.click(f'.choice[data-i="{target}"]')
    page.wait_for_selector(".slot.filled")
    assert page.locator(".slot .star").count() == 0


def test_right_hand_only_asks_right_hand_notes(page, base_url):
    page.goto(base_url + "who-lives-here/")
    page.click('#handSeg button[data-v="right"]')
    seen = []
    for _ in range(4):
        page.wait_for_selector('#stage[data-phase="id"]')
        seen.append(answer_animal(page))
    assert set(seen) <= RIGHT


def test_level_2_names_both_friends_then_step_or_skip(page, base_url):
    page.goto(base_url + "who-lives-here/")
    page.click('#levelSeg button[data-v="2"]')
    for _ in range(2):
        page.wait_for_selector('#stage[data-phase="id"]')
        answer_animal(page)
    page.wait_for_selector('#stage[data-phase="interval"]')
    assert page.locator(".choice.int").count() == 2
    answer = page.get_attribute("#stage", "data-answer")
    assert answer in ("step", "skip")
    page.click(f'.choice[data-int="{answer}"]')
    assert page.locator("#ask").inner_text().lower().startswith(f"a {answer}")
    page.wait_for_selector(".slot.filled.pair")
    clean(page)


def test_low_c_has_its_stem_up(page, base_url):
    # Seeds make the deal repeatable, so this finds the same low-C game every run.
    for seed in range(1, 200):
        page.goto(base_url + f"who-lives-here/?seed={seed}")
        if page.get_attribute("#stage", "data-target") == "0":
            assert page.get_attribute("#note0", "data-stem") == "up"
            return
    raise AssertionError("no seed from 1 to 199 starts on low C")


def test_a_seed_deals_the_same_game_every_time(page, base_url):
    firsts = []
    for _ in range(2):
        page.goto(base_url + "who-lives-here/?seed=21")
        firsts.append(page.get_attribute("#stage", "data-target"))
    assert firsts[0] == firsts[1]
