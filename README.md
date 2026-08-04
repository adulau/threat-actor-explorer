# MISP Galaxy Threat Actor Explorer

A standalone, browser-only HTML/JavaScript application for exploring the MISP `threat-actor` galaxy, UUID-based relationships across every cluster in the MISP Galaxy repository, and shared MISP Galaxy metadata. Graph rendering is performed by Pivotick.

<img width="1766" height="1020" alt="image" src="https://github.com/user-attachments/assets/3b5abdeb-9f45-4686-98ae-0f4a72075156" />

## Run with the bundled repositories

Clone with its submodules and start the local server:

```sh
git clone --recurse-submodules <repository-url>
cd threat-actor-explorer
./start-standalone.sh
```

Then open `http://localhost:8000/misp-threat-actor-explorer.html`. The launcher builds Pivotick once, creates a manifest for the checked-out MISP Galaxy clusters, and serves the application locally. The application automatically reads both submodules and requires no initial ZIP import or GitHub API request. Node.js/npm and Python 3 are required by the launcher; set `PORT` or `HOST` to override its defaults.

For an existing checkout, `git submodule update --init --recursive` obtains the bundled repositories. A later `git submodule update --remote` followed by restarting the launcher updates the local data sources.

The original single-file workflow remains available: open `misp-threat-actor-explorer.html` directly in a recent browser and select **Download and initialise**, or use **Data** to import release files manually. Browsers do not permit an HTML file opened through `file://` to enumerate neighboring files, so submodule auto-loading uses the launcher.

The fallback single-file workflow requires no HTTP server, backend, build step, account, or GitHub token.

## Local caching

When the launcher is used, the application first loads:

- the browser bundle built from the checked-out `pivotick` submodule;
- all cluster JSON files from the checked-out `misp-galaxy` submodule.

If those local files are unavailable, the existing download workflow downloads:

- the latest Pivotick release browser bundle from `Pivotick/Pivotick`;
- a ZIP of the current `main` commit from `MISP/misp-galaxy`.

It stores the Pivotick JavaScript/CSS, the raw MISP repository ZIP, and a normalized UUID index in IndexedDB. After the first successful load, the same browser profile can reopen the application without a network connection.

Use **Data** to update, import release files manually, export visible graph data, or clear the cache.

## Metadata pivots

The application creates a local inverted index of the values contained in each record's `meta` object.

- Enable **metadata nodes** in the graph toolbar to add metadata values to the Pivotick graph.
- Use **Meta fields** to select which fields are represented. The selector shows record and distinct-value counts for every discovered field.
- Click a metadata value in the inspector to pivot immediately, even when metadata nodes are not currently enabled.
- Click any synonym in the actor identity panel to pivot across every galaxy value that shares it. Synonyms are indexed even when MISP supplies them outside the `meta` object.
- Double-click a metadata graph node to use it as the graph root.
- A metadata root reveals all galaxy records sharing the same field and normalized value.
- Continue through another record and another metadata field to perform chained pivots.
- Use **Back to actor** to return to the selected threat actor.

Graph depth applies to both MISP relationships and metadata links. For example, depth 2 can show an actor, its metadata values, and other records sharing those values.

## Graph readability

The graph toolbar includes three display controls:

- **Producers** — filter threat-actor names using the producer UUID attached to each `meta.name-attribution` entry. Select one vendor, any combination of vendors, or keep the default **All** view. UUIDs are resolved to names through the MISP `producer` galaxy, and the selection is saved locally and included in graph JSON exports.

- **Nodes** — choose readable cards, full-name cards, compact cards, or the original geometric shapes. Readable cards wrap names over multiple lines; full-name cards do not clamp the title. The card proportions keep connection endpoints visually close to their borders while still leaving room for names, semantic entity classes, and galaxy types. Metadata cards show their field and match count.
- **Country flags** — show a small flag on graph nodes whose cluster metadata contains a recognized `meta.country` value. Country names and ISO 3166-1 alpha-2 codes are recognized, and common United Kingdom forms such as `UK`, `GB`, and `Great Britain` are normalized to `GB`. Unknown two-letter values are ignored rather than rendered as invalid flags. Flags are enabled by default, can be disabled from the toolbar, and the preference is saved locally. Shape-mode labels receive the same optional flag prefix.
- **Edge labels** — show all labels, only ordinary relationships, only metadata fields, or no labels. Relationship labels use larger, high-contrast pills and remain horizontal, while stronger relationship lines and arrowheads stay legible against the graph canvas.

Pivotick runs in its **full UI mode**, so its complete graph control surface is also available. Use Pivotick's View controls to switch layouts and reorder the graph, tune or pause the force physics, change grid settings, fit or zoom the viewport, and access the remaining graph tools.

The current graph root has a cyan outline and a **ROOT** marker. Node and edge display preferences are saved in local browser storage and included in graph JSON exports.

## Features

- Threat-actor search across values, aliases, synonyms, descriptions, and UUIDs, with sidebar filters for minimum relationship count, minimum synonym count, and the `targeted-sector` metadata field.
- A clearly labelled main name and complete, clickable synonym list for every selected threat actor.
- Directed outgoing and optional reverse relationship traversal.
- Configurable depth and graph-size limit.
- Semantic entity classes: Actor, Activity, Technique, Producer, Tool, Metadata, and Other.
- Responsive card-based nodes with wrapped or full names, semantic icons, optional country flags, root highlighting, and a geometric-shape fallback.
- High-contrast, filterable relationship and metadata edge labels.
- Selectable metadata fields with global value-to-record indexing.
- Chained pivots between galaxy records and metadata values.
- Pivotick graph tooltips containing complete flattened metadata.
- External inspector with full nested metadata, clickable metadata pivots, raw JSON, node table, and relationship table.
- JSON and CSV exports including metadata graph settings and nodes.
- Offline cache and manual ZIP/JSON import.
- Unresolved relationship UUIDs remain visible as placeholder nodes.

## Browser requirements

The app uses IndexedDB, Fetch, Blob URLs, and `DecompressionStream('deflate-raw')` to read GitHub ZIP archives. A recent Firefox, Chromium, or Edge release is recommended.

## Security model

Galaxy metadata is escaped before display. Only `http:` and `https:` references are made clickable. The application does not send imported or cached data to a server.

## License

MISP Galaxy Threat Actor Explorer is licensed under the [BSD 2-Clause License](LICENSE).

Pivotick and MISP Galaxy are bundled as submodules and retain their respective upstream licenses and attribution. Review those repositories for the license terms that apply to their code and data.
