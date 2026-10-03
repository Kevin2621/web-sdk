# Selected Engine math package

The exporter packages the current **Standard Bonus Buys · 50× / 200× / 500×**
selection, profile `candidate-corrected-1m-1`, with Golden Picks disabled.
It preserves the original outcomes, book IDs, event payloads, payouts and lookup
bytes/weights. It reads source SQLite files in read-only mode and copies recorded
medium/high lane books; it does not simulate a replacement pool or rebalance.
SQLite is only an offline source format, never a deployed game dependency.

## Files to upload

Upload the contents of `publish_files/` as the math package:

| Engine mode | Cost | Books | Lookup |
| --- | ---: | --- | --- |
| `base` | 1 | `books_base.jsonl.zst` | `lookUpTable_base_0.csv` |
| `bonus` | 50 | `books_bonus.jsonl.zst` | `lookUpTable_bonus_0.csv` |
| `standard_bonus_buy_medium` | 200 | `books_standard_bonus_buy_medium.jsonl.zst` | `lookUpTable_standard_bonus_buy_medium_0.csv` |
| `standard_bonus_buy_high` | 500 | `books_standard_bonus_buy_high.jsonl.zst` | `lookUpTable_standard_bonus_buy_high_0.csv` |

`index.json` registers these exact names, costs and filenames. This matches the
[Math SDK publish format](https://github.com/StakeEngine/math-sdk/blob/main/docs/math_docs/quickstart.md)
and the workspace SDK's `make_index_config` implementation.
Each lookup row is `book ID,weight,payout in hundredths`. Book/event amounts stay
in hundredths; the frontend converts them to decimal multipliers at its Bet/replay
boundary. The 50× source's available maximum remains **2,922.3×**; the other modes
have 5,000× cap outcomes. Packaging does not add missing outcomes.

`package-report.json` records source/output hashes, book/event counts, exact weight
totals and RTP fractions. `sdk-verification.json` records the Math SDK's separate
format and ordered-payout checks. Both reports belong outside the uploaded folder.
Large generated files are Git-ignored and excluded from the frontend build.

## Reproduce and verify

From the Web SDK root, using the workspace Python environment with `zstandard`
and `numpy` installed:

```sh
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/test-export-engine-math.py
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/export-engine-math.py
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/verify-engine-math.py
```

Export refuses to overwrite existing final or staging files by default.
For an interrupted export, `--resume-staging` rechecks existing complete mode
files against the original source payload hashes and finishes incomplete modes;
it still refuses to overwrite a final package. To create another
package, choose a new directory with `--output /path/to/new-package`; pass the
same directory to verification with `--package /path/to/new-package`.
The exporter checks selected source hashes, every book's payout/lookup agreement,
event ordering, cap/spin constraints and disabled Golden Picks. It then decompresses
its output independently and checks payload hashes and coverage. The verifier
also uses the local SDK's format checks and compares the full ordered payout arrays.

Local verification does not establish Engine upload acceptance. On Engine, verify
the uploaded modes/costs and frontend together, then exercise normal spins, each
buy tier, natural bonus, cap endings, refresh/resume and replay. Wallet, settlement,
autoplay and real endpoint behavior remain Engine acceptance checks.

## Stronger lossless compression

Level-15 recompression is queued in a separate package, leaving the original intact:

```sh
PYTHONDONTWRITEBYTECODE=1 ../.venv/bin/python apps/wild-pickins/scripts/recompress-engine-math.py
```

Output: `engine-math/compressed-level15/publish_files/`. Log:
`/private/tmp/wp-math-recompression.log`. The script streams the original JSONL
bytes into ordinary Zstandard frames with no external dictionary and no increase
to the original decoder window requirement. It copies the index and CSVs exactly,
checks source hashes, then independently decompresses every new book file and
compares the full payload hash and book count. Math SDK format/ordered-payout
verification runs automatically afterward. Two recompression regression checks
pass, covering exact round trips, overwrite protection and modified payloads.

Do not use the new package until its `sdk-verification.json` exists and the log
ends with `Verified compressed package`. Size savings are measured after the full
job finishes. This changes upload/storage size, not outcomes, weights, events or
the amount of round data the RGS must process. It does not establish the cause of
the earlier HTML-response publishing error.
