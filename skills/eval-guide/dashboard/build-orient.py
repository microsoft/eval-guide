#!/usr/bin/env python3
"""Pre-build the static orient dashboard HTML.

The orient dashboard is agent-agnostic — it shows the Per-Agent Eval Maturity
Model and what the session delivers, identical for every agent. We render it
once from `examples/stage-orient-data.json` + the templates and ship the
resulting HTML in this folder. The skill opens the static file directly; no
per-session JSON write, no Python launch needed at orient time.

Re-run this script when:
- `templates/orient.html` or `templates/base.html` change
- `examples/stage-orient-data.json` changes (e.g., maturity model definitions
  or the deliverable phases update)

Usage:
    python build-orient.py
"""

from pathlib import Path
import sys

# Reuse the same generator the live dashboard uses.
HERE = Path(__file__).parent
sys.path.insert(0, str(HERE))
from serve import generate_html  # noqa: E402

import json  # noqa: E402


def main() -> None:
    data_path = HERE / "examples" / "stage-orient-data.json"
    out_path = HERE / "orient-dashboard.html"

    data = json.loads(data_path.read_text(encoding="utf-8"))
    html = generate_html("orient", data)
    out_path.write_text(html, encoding="utf-8")

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
