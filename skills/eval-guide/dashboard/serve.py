#!/usr/bin/env python3
"""Generate and serve interactive eval dashboards for each eval-guide stage.

Reads a stage-specific JSON data file, injects it into an HTML template,
writes a standalone HTML file, and opens it directly in the browser.
User feedback is saved to a JSON file on disk (via a lightweight background
server) that Claude reads to iterate or proceed.

Usage:
    python serve.py --stage orient --data stage-orient-data.json   # read-only, exits after open
    python serve.py --stage discover --data stage-0-data.json
    python serve.py --stage plan --data stage-1-data.json
    python serve.py --stage generate --data stage-2-data.json
    python serve.py --stage interpret --data stage-4-data.json

    # Write to a specific path instead of next to the data file:
    python serve.py --stage plan --data stage-1-data.json --out /tmp/plan.html

    # Legacy server mode (serves HTML dynamically via HTTP):
    python serve.py --stage plan --data stage-1-data.json --serve --port 3118

No dependencies beyond the Python stdlib are required.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import threading
import time
import webbrowser
from functools import partial
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

STAGES = {
    # `wait_for_feedback: False` marks an informational stage that doesn't gate
    # the rest of the session — serve.py opens the browser and exits immediately.
    "orient": {"label": "Orient: Maturity Snapshot", "number": 0, "wait_for_feedback": False},
    "discover": {"label": "Stage 0: Discover", "number": 0},
    "plan": {"label": "Stage 1: Plan", "number": 1},
    "generate": {"label": "Stage 2: Generate", "number": 2},
    "interpret": {"label": "Stage 4: Interpret", "number": 3},
}


def generate_html(stage: str, data: dict, previous_feedback: dict | None = None) -> str:
    """Generate the complete standalone HTML page with embedded data."""
    templates_dir = Path(__file__).parent / "templates"

    base_html = (templates_dir / "base.html").read_text(encoding="utf-8")
    stage_html = (templates_dir / f"{stage}.html").read_text(encoding="utf-8")

    # Compose: inject stage content into base
    html = base_html.replace("<!--__STAGE_CONTENT__-->", stage_html)

    # Build embedded data
    stage_info = STAGES[stage]
    embedded = {
        "stage": stage,
        "stage_label": stage_info["label"],
        "stage_number": stage_info["number"],
        "total_stages": 4,
        "data": data,
        "previous_feedback": previous_feedback or {},
    }

    data_json = json.dumps(embedded)
    html = html.replace("/*__EMBEDDED_DATA__*/", f"const EMBEDDED_DATA = {data_json};")

    return html


# ---------------------------------------------------------------------------
# HTTP server (stdlib only, zero dependencies)
# ---------------------------------------------------------------------------

def _kill_port(port: int) -> None:
    """Kill any process listening on the given port."""
    if sys.platform == "win32":
        try:
            result = subprocess.run(
                ["netstat", "-ano"],
                capture_output=True, text=True, timeout=5,
            )
            for line in result.stdout.strip().split("\n"):
                if f":{port}" in line and "LISTENING" in line:
                    parts = line.strip().split()
                    pid = parts[-1]
                    try:
                        subprocess.run(["taskkill", "/PID", pid, "/F"],
                                       capture_output=True, timeout=5)
                    except (subprocess.TimeoutExpired, OSError):
                        pass
            time.sleep(0.5)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
    else:
        try:
            result = subprocess.run(
                ["lsof", "-ti", f":{port}"],
                capture_output=True, text=True, timeout=5,
            )
            for pid_str in result.stdout.strip().split("\n"):
                if pid_str.strip():
                    try:
                        os.kill(int(pid_str.strip()), signal.SIGTERM)
                    except (ProcessLookupError, ValueError):
                        pass
            if result.stdout.strip():
                time.sleep(0.5)
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass


class DashboardHandler(BaseHTTPRequestHandler):
    """Serves the dashboard HTML and handles feedback saves."""

    def __init__(
        self,
        stage: str,
        data: dict,
        feedback_path: Path,
        previous_feedback: dict | None,
        *args,
        **kwargs,
    ):
        self.stage = stage
        self.data = data
        self.feedback_path = feedback_path
        self.previous_feedback = previous_feedback
        super().__init__(*args, **kwargs)

    def do_GET(self) -> None:
        if self.path == "/" or self.path == "/index.html":
            html = generate_html(self.stage, self.data, self.previous_feedback)
            content = html.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        elif self.path == "/api/feedback":
            body = b"{}"
            if self.feedback_path.exists():
                body = self.feedback_path.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def do_POST(self) -> None:
        if self.path == "/api/feedback":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                feedback = json.loads(body)
                if not isinstance(feedback, dict):
                    raise ValueError("Expected JSON object")
                # Ensure required fields
                feedback.setdefault("stage", self.stage)
                feedback.setdefault("status", "in_progress")
                self.feedback_path.write_text(json.dumps(feedback, indent=2) + "\n")
                resp = b'{"ok":true}'
                self.send_response(200)
            except (json.JSONDecodeError, OSError, ValueError) as e:
                resp = json.dumps({"error": str(e)}).encode()
                self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(resp)))
            self.end_headers()
            self.wfile.write(resp)
        else:
            self.send_error(404)

    def log_message(self, format: str, *args: object) -> None:
        pass


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate eval-guide interactive dashboard")
    parser.add_argument(
        "--stage", "-s", required=True, choices=list(STAGES.keys()),
        help="Dashboard stage",
    )
    parser.add_argument(
        "--data", "-d", required=True, type=Path,
        help="Path to stage data JSON file",
    )
    parser.add_argument(
        "--out", "-o", type=Path, default=None,
        help="Write HTML to this path (default: next to the data file as <stage>-dashboard.html)",
    )
    parser.add_argument(
        "--previous-feedback", type=Path, default=None,
        help="Path to previous iteration's feedback JSON (shows what was changed last time)",
    )
    # Legacy flags
    parser.add_argument(
        "--serve", action="store_true",
        help="Start an HTTP server instead of writing a static file (legacy mode)",
    )
    parser.add_argument("--port", "-p", type=int, default=3118, help="Server port (only with --serve)")
    parser.add_argument(
        "--static", type=Path, default=None,
        help="Alias for --out (deprecated, kept for backwards compatibility)",
    )
    args = parser.parse_args()

    data_path = args.data.resolve()
    if not data_path.exists():
        print(f"Error: {data_path} not found", file=sys.stderr)
        sys.exit(1)

    try:
        data = json.loads(data_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"Error reading {data_path}: {e}", file=sys.stderr)
        sys.exit(1)

    stage = args.stage
    feedback_path = data_path.parent / f"{stage}-feedback.json"

    previous_feedback = None
    if args.previous_feedback and args.previous_feedback.exists():
        try:
            previous_feedback = json.loads(args.previous_feedback.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass

    # --- HTTP server mode ---
    # Read-only stages (no feedback gate) ignore --serve and use the static-HTML
    # path below — running a server with no Confirm button would hang forever.
    if args.serve and STAGES[stage].get("wait_for_feedback", True):
        port = args.port
        _kill_port(port)

        handler = partial(DashboardHandler, stage, data, feedback_path, previous_feedback)
        try:
            server = HTTPServer(("127.0.0.1", port), handler)
        except OSError:
            server = HTTPServer(("127.0.0.1", 0), handler)
            port = server.server_address[1]

        stage_label = STAGES[stage]["label"]
        url = f"http://localhost:{port}"
        print(f"\n  Eval Dashboard - {stage_label}")
        print(f"  {'-' * 40}")
        print(f"  URL:       {url}")
        print(f"  Data:      {data_path}")
        print(f"  Feedback:  {feedback_path}")
        if previous_feedback:
            print(f"  Previous:  {args.previous_feedback}")
        print()

        # Run the HTTP server in a daemon thread so the main thread can poll
        # for terminal feedback status and shut down cleanly.
        server_thread = threading.Thread(target=server.serve_forever, daemon=True)
        server_thread.start()

        webbrowser.open(url)

        print(f"  Server running at {url} — waiting for customer to confirm in browser...")
        print(f"  (Server will auto-shutdown when feedback is submitted.)\n")

        # Poll the feedback file: the POST handler writes it on every save
        # (including in_progress auto-saves), but we only exit on a terminal
        # status — confirmed or changes_requested. When that happens we ALSO
        # print the feedback JSON to stdout between markers so the AI can
        # pick it up directly from bash output — no disk read required.
        terminal_feedback = None
        try:
            while True:
                if feedback_path.exists():
                    try:
                        fb = json.loads(feedback_path.read_text(encoding="utf-8"))
                        if fb.get("status") in ("confirmed", "changes_requested"):
                            terminal_feedback = fb
                            break
                    except (json.JSONDecodeError, OSError):
                        pass
                time.sleep(0.5)
        except KeyboardInterrupt:
            print("\nStopped.")
        finally:
            server.shutdown()
            server.server_close()
        if terminal_feedback is not None:
            status = terminal_feedback["status"]
            print(f"  Feedback received: {status}\n")
            # The marker block is what the orchestrating skill parses. The
            # disk file at feedback_path is kept as a backup but is not the
            # primary channel anymore.
            print("===EVAL_GUIDE_FEEDBACK_BEGIN===")
            print(json.dumps(terminal_feedback, indent=2, ensure_ascii=False))
            print("===EVAL_GUIDE_FEEDBACK_END===")
        return
    elif args.serve:
        print(f"  Note: --serve does not apply to read-only stage '{stage}'.")
        print(f"  Generating static HTML and opening in browser instead.\n")

    # --- Default: generate static HTML, open in browser, wait for feedback ---
    out_path = args.out or args.static or (data_path.parent / f"{stage}-dashboard.html")
    out_path = out_path.resolve()

    # Embed the feedback file path so the HTML can show it to the user
    data["__feedback_filename__"] = f"{stage}-feedback.json"

    html = generate_html(stage, data, previous_feedback)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")

    stage_label = STAGES[stage]["label"]
    print(f"\n  Eval Dashboard - {stage_label}")
    print(f"  {'-' * 40}")
    print(f"  HTML:      {out_path}")
    print(f"  Feedback:  {feedback_path}")
    print()

    webbrowser.open(str(out_path))

    # Informational stages (no feedback gate) open the browser and exit immediately —
    # the AI continues the conversation without waiting for the user to confirm.
    if not STAGES[stage].get("wait_for_feedback", True):
        print(f"  Read-only stage. Browser opened for review; no confirmation required.")
        print(f"  Continue the conversation in the terminal.\n")
        return

    # Wait for the feedback file to appear (user confirms in the browser)
    print(f"  Waiting for feedback... (user reviews in browser)")
    print(f"  The dashboard will save {feedback_path.name} when confirmed.\n")

    try:
        while True:
            if feedback_path.exists():
                try:
                    fb = json.loads(feedback_path.read_text(encoding="utf-8"))
                    if fb.get("status") in ("confirmed", "changes_requested"):
                        status = fb["status"]
                        print(f"  Feedback received: {status}")
                        print(f"  File: {feedback_path}\n")
                        break
                except (json.JSONDecodeError, OSError):
                    pass
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopped waiting.")


if __name__ == "__main__":
    main()
