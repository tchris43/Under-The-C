"""Practice Buddy: missions played on the on-screen keys, and on a "real piano" through a fake microphone."""
import math
import random
import struct
import wave

import pytest

from helpers import clean

LIGHTLY_ROW = [(67, 1), (64, 1), (64, 2), (65, 1), (62, 1), (62, 2), (60, 1), (62, 1), (64, 1), (65, 1), (67, 1), (67, 1), (67, 2)]


def open_plan(page, base_url, k=0):
    page.goto(base_url + "practice-buddy/")
    page.click(f'#planList [data-k="{k}"]')


def mission(page, i):
    page.click(f'[data-go="{i}"]')
    page.wait_for_selector(f'#drillPanel[data-phase="play"]')


def key(page, m):
    page.locator(f'#keys [data-m="{m}"]').dispatch_event("pointerdown")


def test_plans_and_the_demo_missions(page, base_url):
    page.goto(base_url + "practice-buddy/")
    plans = page.locator("#planList .plan strong").all_inner_texts()
    assert plans == ["Lightly Row", "Hot Cross Buns", "Mary Had a Little Lamb", "Twinkle, Twinkle", "Ode to Joy", "Minuet in G (opening)"]
    page.click('#planList [data-k="0"]')
    tags = page.locator("#missions .tag").all_inner_texts()
    assert [t.lower() for t in tags] == ["starting spot", "find the note", "rhythm", "slow and steady", "play the song"]
    assert page.locator("#missions .av svg").count() == 5
    clean(page)


def test_starting_spot_glows_after_two_misses_then_celebrates(page, base_url):
    open_plan(page, base_url)
    mission(page, 0)
    key(page, 62)
    assert "Try again" in page.inner_text("#fb")
    key(page, 64)
    assert page.locator('#keys [data-m="60"].glow').count() == 1
    key(page, 60)
    page.wait_for_selector(".celebrate")
    clean(page)


def test_playing_the_whole_line_finishes_the_mission_and_is_remembered(page, base_url):
    open_plan(page, base_url)
    mission(page, 4)
    key(page, 60)  # a wrong note doesn't move on
    assert page.get_attribute("#drillPanel", "data-at") == "0"
    for m, _ in LIGHTLY_ROW:
        key(page, m)
    page.wait_for_selector(".celebrate")
    page.click("#backBtn")
    assert page.locator("#missions .mission.done").count() == 1
    assert page.locator("#dots i.on").count() == 1
    page.reload()
    page.click('#planList [data-k="0"]')
    assert page.locator("#missions .mission.done").count() == 1
    clean(page)


def test_find_the_sharp_is_the_black_key(page, base_url):
    open_plan(page, base_url, 5)  # Minuet in G
    mission(page, 1)
    assert "F♯" in page.inner_text("#drillBody")
    key(page, 65)
    assert "Try again" in page.inner_text("#fb")
    key(page, 66)
    page.wait_for_selector(".celebrate")


def test_rhythm_checks_the_long_notes(page, base_url):
    open_plan(page, base_url)
    mission(page, 2)
    beats = [1, 1, 2, 1, 1, 2]  # G E E-e F D D-d
    tap = page.locator("#tapBtn")
    for _ in beats:  # all the same length: the long notes are too short
        tap.dispatch_event("pointerdown")
        page.wait_for_timeout(300)
    assert "long notes" in page.inner_text("#fb")
    page.wait_for_timeout(1800)
    for b in beats:
        tap.dispatch_event("pointerdown")
        page.wait_for_timeout(int(b * 320))
    page.wait_for_selector(".celebrate")


# ---------- Listening (Chromium's fake microphone) ----------

def piano_wav(path, notes, beat=0.5, sr=22050):
    """A made-up piano recording: slightly stretched overtones that fade, with a little room noise."""
    rnd = random.Random(5)
    total = int(sr * (1.0 + sum(b for _, b in notes) * beat + 2))
    out = [0.0] * total
    pos = int(sr * 1.0)
    for m, b in notes:
        f = 440 * 2 ** ((m - 69) / 12)
        for i in range(min(int(sr * 2.0), total - pos)):
            t = i / sr
            y = sum(a * math.sin(2 * math.pi * f * k * math.sqrt(1 + 0.0004 * k * k) * t) * math.exp(-t * (1.2 + 0.5 * k))
                    for k, a in ((1, 1), (2, .6), (3, .35), (4, .2), (5, .12)))
            out[pos + i] += y * min(1, t / 0.004)
        pos += int(sr * b * beat)
    peak = max(abs(x) for x in out)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(b"".join(struct.pack("<h", int((x / peak * 0.5 + rnd.uniform(-0.002, 0.002)) * 32767)) for x in out))


@pytest.fixture
def chromium_page(pw, base_url):
    """Chromium on its own, for the microphone tests (WebKit can't fake a microphone)."""
    browsers = []

    def launch(args=()):
        b = pw.chromium.launch(args=list(args))
        browsers.append(b)
        pg = b.new_context(viewport={"width": 1100, "height": 1200}).new_page()
        pg.problems, pg.outside_requests = [], []
        pg.on("pageerror", lambda e: pg.problems.append(f"page error: {e}"))
        pg.on("request", lambda r: None if r.url.startswith((base_url, "data:", "blob:")) else pg.outside_requests.append(r.url))
        return pg
    yield launch
    for b in browsers:
        b.close()


def test_listening_to_a_real_piano_plays_the_mission(chromium_page, base_url, tmp_path):
    wav = tmp_path / "lightly-row.wav"
    piano_wav(wav, LIGHTLY_ROW)
    page = chromium_page(["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", f"--use-file-for-fake-audio-capture={wav}"])
    open_plan(page, base_url)
    mission(page, 4)
    page.click("#micBtn")
    page.wait_for_selector('body[data-listening="on"]')
    assert "Listening" in page.inner_text("#micLabel")
    page.wait_for_selector(".celebrate", timeout=20000)
    assert page.inner_text("#heardNote") in {"G", "E", "F", "D", "C"}
    page.click("#micBtn")
    assert page.get_attribute("body", "data-listening") == "off"
    clean(page)


def test_without_a_microphone_the_keys_still_work(chromium_page, base_url):
    page = chromium_page()  # no microphone allowed
    open_plan(page, base_url)
    mission(page, 0)
    page.click("#micBtn")
    page.wait_for_selector('body[data-listening="off"]')
    assert "tap the keys" in page.inner_text("#micStatus")
    key(page, 60)
    page.wait_for_selector(".celebrate")
