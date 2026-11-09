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

- Use a search API that returns result URLs, and a lightweight fetch that returns page text as Markdown. Both are stateless, so run a wave's calls in parallel.
- Extract passages with a short script that prints about 200 characters around matches for `headquarter|HQ|head office|offices|located in|based in|registered office|address|Inc\.|Ltd|GmbH|AG|SA|SAS|B\.V\.` and their equivalents in the page's language. Print only those passages, so large pages stay out of context.
- An empty or tiny result means the page renders with JavaScript. Open it in a headless or remote browser.
- Search tools that return a written summary instead of page text give leads only. Open the page and copy the quote yourself.
