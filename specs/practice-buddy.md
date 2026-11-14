# Practice Buddy (site/practice-buddy/)

A teacher's lesson points for one song become small missions the student plays on a real piano.
A preview for the teacher: not linked from the home page yet. Tests: `tests/e2e/test_practice_buddy.py`.

## Plans
1. The page opens on a list of practice plans: the demo plan a teacher made for "Lightly Row", then one for each
   starter song (Hot Cross Buns, Mary Had a Little Lamb, Twinkle Twinkle, Ode to Joy, Minuet in G). All public domain.
2. A plan shows its missions as cards, each with a Note Friend, what to remember, and a Practice button.
3. A finished mission gets a check and a filled dot; this is remembered on the device.

## Missions (play on the piano or tap the keys on screen)
4. Starting spot: play the key the right hand starts on. Wrong keys get a soft sound; after two misses the key glows.
5. Find the note: play the tricky note (or the song's sharp). The right letter in any octave counts.
6. Rhythm: play (or tap) the first line with the same long and short notes as the music, at your own speed.
   Notes held too short are pointed out ("Hold the long notes a little longer").
7. Slow and steady / Play the song: play each note in order; the next note lights up. Slow adds an optional beat.
8. A finished mission shows stars and a cheer, with "Do it again" and "Next mission".

## Listening
9. "Listen to my piano" asks to use the microphone, then hears one note at a time and shows it ("I heard E")
   with a level bar. A note counts when a key is struck, so a repeated note (E E) counts twice.
10. While listening, the right letter in a different octave counts (microphones sometimes hear a note an octave off).
11. The app's own sounds (Listen, cheers, the beat) are never heard as the child's notes.
12. If the microphone isn't allowed or can't be used, the page says so and everything still works by tapping.
13. The sound stays on the device: nothing is recorded, saved or sent. Listening stops when the page is hidden.
