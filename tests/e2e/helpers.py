"""Small helpers shared by the browser tests."""
LETTER_OF = "CDEFGABCDEFG"  # note index -> letter, matching site/kit/notes.js
LEFT = set(range(0, 8))
RIGHT = set(range(7, 12))
PAGES = ["", "under-the-sea/", "who-lives-here/", "note-flash/"]


def clean(page):
    """No errors in the browser console and no requests to any other website."""
    assert page.problems == [], page.problems
    assert page.outside_requests == [], page.outside_requests
