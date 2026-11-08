# Note Flash, Level 3 (site/note-flash/)

Name the note with no animal on it. Tests: `tests/e2e/test_note_flash.py`.

0. The shared setup screen comes first (see kit.md): friends, answer mode, and letters on the keys (shown only for Piano Keys).
   During play there are no settings buttons on screen, only the settings icon, which brings the setup screen back.
1. A game is ten notes from the chosen friends, placed left to right by pitch.
2. Answer mode: Letter Pad (tap C D E F G A B) or Piano Keys (tap the exact key). The piano shows the whole hand's keys,
   or both hands when the friends cross middle C.
3. Right answer: the friend who lives there pops onto the note, its home lights up, the button or key turns the friend's colour.
4. Wrong answer: a soft sound and a shake. After two misses, the friend appears faintly on the note as a hint.
5. Piano Keys: the right letter in the wrong place says "Right letter! Find the other C." Middle C has a blue stripe. Letters on the keys can be turned off on the setup screen.
6. Stickers and a gold star per first-try note; a celebration at the end.
7. Laptop: type A–G (any key with that letter counts, since typing can't pick an octave).
