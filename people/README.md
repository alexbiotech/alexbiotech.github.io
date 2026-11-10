# People directory

`people.json` is the public source for the English and Chinese pages. To update it:

1. Check the person's current role against their own or their institution's page.
2. Add original interviews, articles or videos with their actual dates. Use an empty date for ongoing archives, and explain older recordings or replays in the note.
3. Keep the English and Chinese fields consistent, preserve the person's stable ID, and include the original sources.
4. Run `python tools/build_people.py` from the repository root to regenerate both pages.
5. Preview `/people/` and `/zh/people/`, including search, category filters and narrow screens.

The directory works without JavaScript. JavaScript adds local search and filters; it makes no external requests. The review date is editorial metadata, not an automatic refresh date.
