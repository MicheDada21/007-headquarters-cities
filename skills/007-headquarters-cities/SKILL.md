---
name: 007-headquarters-cities
description: "Lists up to three main headquarters as City (Country) in rank order, each backed by a verbatim quote from the company's own pages. Use when asking where a company or tool is based."
---

# 007 headquarters cities

The target is the cities where each entity runs its main headquarters today: one when that is all it has, up to three when it names more. Each city is written `City (Country)`, for example `Zurich (Switzerland)`.

Every answer comes from the ledger: one row per claim, with a URL and a verbatim quote read on that page. Memory and search-engine summaries only tell you where to look.

## Definitions

- The operator is the company that runs the tool today. A company or startup runs itself. An in-house product is run by its parent company. A startup or project that a larger company bought is run by the office that still runs it, otherwise by the acquirer. It counts as acquired when a source states that a larger company bought the startup, its team and product, or the project's IP: a deal announced by either side, not talks, rumors, investments or a founder taking a job there.
- A headquarters is an office the operator runs today and names as its headquarters, head office, main office or one of its hubs. Rank them:
  1. The main or global headquarters the operator names.
  2. Co-headquarters and regional headquarters the operator names.
  3. Other operating offices the operator lists, in the order it lists them.

  Stop at three.
- A legal seat counts, with basis `registered`, only when no operating office is on record. A registered-agent address (a Delaware or Wyoming agent, for example), a virtual office, a data center, a store and a former office never count.
- An operator that is fully remote with no office or legal seat on record gets `not_public`.
- Write the city by its common English name and the country by its English short name.

## Steps

1. List. Save the entities to `entities.json` as `[{ "name", "url" }]`, keeping any id the user's list carries. Done when the file matches the request.

2. Operator. Decide who runs each entity from its own site, its footer and imprint. For every entity made by a larger company, check whether that company built it or bought it: search `<entity> acquired by` and the company's own announcement. Done when every entity has an operator, and every acquired one has an `acquired_by` row with a quote.

3. Offices. Climb the rungs in [references/source-ladder.md](references/source-ladder.md) for each operator. Work in waves and send every lookup of a wave at once; for more than 15 entities, split the waves across subagents when the host can start them; each returns its claims with URL and quote, and the main agent alone writes the ledger. Spend at most four lookups per entity, plus a fifth in the home-market language when none of the four used it and it isn't English, then record `not_public`. Done when every entity has at least one ranked city or `not_public`.

4. Ledger. Write `ledger.jsonl`, one row per claim:

   ```json
   {"entity":"Proton Mail","field":"hq","rank":1,"value":"Geneva (Switzerland)","basis":"hq","url":"https://proton.me/legal/imprint","quote":"Proton AG, Route de la Galaise 32, 1228 Plan-les-Ouates, Geneva, Switzerland","tier":"primary","lang":"en","retrieved":"2026-11-08","status":"verified"}
   ```

   | `field` | `value` | `rank` | `basis` |
   |---|---|---|---|
   | `hq` | `City (Country)` | 1, 2 or 3 | `hq` or `registered` |
   | `acquired_by` | Acquirer's name; an optional numeric `year` gives the deal year | none | none |

   Carry any id from `entities.json` on every row of that entity. A row's `note` explains when the city belongs to the parent or acquirer.

   `tier`: `primary` for the operator's own pages and official registries; `press` for bylined journalism; `reference` for Wikipedia and Wikidata together; `directory` for Crunchbase and similar.

   `status`: `verified` for one primary source or two independent press or reference sources; `single_source` for one press, reference or directory source; `conflict` when sources disagree, one row per version; `not_public` when the budget ran out. Done when every city in the report has a row.

5. Self-check. Reread every row next to its quote. An `hq` row passes when the quote places an office or legal seat of the operator in that city today, and its rank follows the order above. An `acquired_by` row passes when the quote states a completed deal. A job posting, an event or a founder's home never proves an office. Replace a failing row with a source that passes, or set it to `not_public`. Done when every row passes.

6. Report. One table: entity, operator when it differs, and headquarters as `City (Country)` in rank order with status. List conflicts under it with both versions, then the ledger path. Done when each cell traces to a ledger row and every `not_public` cell says so in plain words.
