#!/usr/bin/env python3
"""Generate and serve interactive eval dashboards for each eval-guide stage.

Reads a stage-specific JSON data file, injects it into an HTML template,
and serves it via a tiny HTTP server. User feedback auto-saves to a
feedback JSON file that Claude reads to iterate or proceed.

Usage:
    python serve.py --stage discover --data stage-0-data.json
    python serve.py --stage plan --data stage-1-data.json --port 3118
    python serve.py --stage generate --data stage-2-data.json
    python serve.py --stage interpret --data stage-4-data.json

    # Static mode (no server):
    python serve.py --stage discover --data stage-0-data.json --static output.html

No dependencies beyond the Python stdlib are required.
"""

import argparse
import json
import os
import signal
import subprocess
import sys
import time
import webbrowser
from functools import partial
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

STAGES = {
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
    parser = argparse.ArgumentParser(description="Serve eval-guide interactive dashboard")
    parser.add_argument(
        "--stage", "-s", required=True, choices=list(STAGES.keys()),
        help="Dashboard stage to serve",
    )
    parser.add_argument(
        "--data", "-d", required=True, type=Path,
        help="Path to stage data JSON file",
    )
    parser.add_argument("--port", "-p", type=int, default=3118, help="Server port (default: 3118)")
    parser.add_argument(
        "--previous-feedback", type=Path, default=None,
        help="Path to previous iteration's feedback JSON (shows what was changed last time)",
    )
    parser.add_argument(
        "--static", type=Path, default=None,
        help="Write standalone HTML to this path instead of starting a server",
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

    if args.static:
        html = generate_html(stage, data, previous_feedback)
        args.static.parent.mkdir(parents=True, exist_ok=True)
        args.static.write_text(html, encoding="utf-8")
        print(f"\n  Static dashboard written to: {args.static}\n")
        sys.exit(0)

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
    print(f"\n  Press Ctrl+C to stop.\n")

    webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
