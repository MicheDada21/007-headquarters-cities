# Source ladder

Climb the ladder top down. The first rung that names the main headquarters fixes rank 1; keep climbing only to rank further offices the operator names.

## Offices

1. The operator's own pages, fetched by exact path: `/about`, `/company`, `/contact`, `/offices`, `/locations`, `/careers`, `/imprint`, `/legal`, `/terms`, and the privacy policy, which names the data controller with its address. A careers page counts only for cities where it names an office, not for remote hiring regions.
2. A national company registry entry for the legal entity named on those pages, recorded with basis `registered`.
3. Wikipedia infobox or Wikidata P159 with a cited source. Wikipedia and Wikidata count as one source together.
4. Bylined press that names the city of the main office, such as funding announcements and local business press.
5. Directories (Crunchbase, LinkedIn company pages), as tie-breakers only.

## Queries

Query the operator's name plus `headquarters`, `head office` or `offices`, and in the home-market language too ("Hauptsitz", "siège social", "sede"). Take that language from evidence already on file: a country-code domain, the imprint, the language of earlier sources.

## Reading pages

Use `scripts/passages.ts` in this skill's folder (needs Bun; it uses the Browserbase `browse` CLI when installed and plain HTTP otherwise). Run it by its full path from the folder that holds the ledger. It prints only what the ledger needs, so search results and whole pages stay out of context.

- `bun scripts/passages.ts search "<query>" "<query>" ...` prints one `url  title` line per result. Put every query of a wave in one call.
- `bun scripts/passages.ts read <url> <url> ...` fetches the wave's pages in parallel, keeps each one in `pages/`, and prints about 200 characters around office and address words. Each passage ends at a sentence or a word, and one already printed in the run, such as a menu or footer, prints once. Add the words of the page's language with `--add "Firmensitz|indirizzo"`.
- A tiny page prints its first characters and the command that opens it in a remote browser, whose `browse get markdown` output goes through `bun scripts/passages.ts stdin <url>`.
- Copy each quote from a printed passage. When a passage is cut short, `grep` a few more words around it in the kept page instead of reading the whole file.
- Search tools that return a written summary instead of page text give leads only. Open the page and copy the quote yourself.
- Without Bun, use the host's search and fetch, save the page text to a file, and print only the passages that match with a short script.
