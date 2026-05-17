#!/usr/bin/env python3
"""Small local bridge for the installed jcodemunch MCP package.

The jcodemunch binary on this machine lives inside the Gemini/Antigravity
virtualenv, not on PATH. This wrapper gives the repo stable commands for
indexing and targeted analysis without depending on an MCP client being
available in the current Codex session.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


DEFAULT_REPO = "local/hasivu-platform-f501c264"
DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_IGNORE = [
    "node_modules/**",
    "web/node_modules/**",
    ".next/**",
    "web/.next/**",
    "dist/**",
    "coverage/**",
    ".git/**",
    ".gitnexus/**",
    "graphify-out/**",
    "worktrees/**",
    ".DS_Store",
]


def print_json(value: object) -> None:
    print(json.dumps(value, indent=2, default=str))


def command_index(args: argparse.Namespace) -> int:
    from jcodemunch_mcp.tools.index_folder import index_folder

    result = index_folder(
        str(Path(args.path).expanduser().resolve()),
        use_ai_summaries=False,
        incremental=not args.force,
        context_providers=False,
        extra_ignore_patterns=DEFAULT_IGNORE,
    )
    print_json(result)
    return 0 if result.get("success") else 1


def command_list(_: argparse.Namespace) -> int:
    from jcodemunch_mcp.tools.list_repos import list_repos

    print_json(list_repos())
    return 0


def command_search(args: argparse.Namespace) -> int:
    from jcodemunch_mcp.tools.search_text import search_text

    print_json(
        search_text(
            repo=args.repo,
            query=args.query,
            file_pattern=args.file_pattern,
            max_results=args.max_results,
            context_lines=args.context_lines,
            is_regex=args.regex,
        )
    )
    return 0


def command_symbols(args: argparse.Namespace) -> int:
    from jcodemunch_mcp.tools.search_symbols import search_symbols

    print_json(
        search_symbols(
            repo=args.repo,
            query=args.query,
            kind=args.kind,
            max_results=args.max_results,
        )
    )
    return 0


def command_blast(args: argparse.Namespace) -> int:
    from jcodemunch_mcp.tools.get_blast_radius import get_blast_radius

    print_json(get_blast_radius(repo=args.repo, symbol=args.symbol, depth=args.depth))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Repo-local jcodemunch bridge")
    sub = parser.add_subparsers(dest="command", required=True)

    index = sub.add_parser("index", help="Index this repository with AI summaries off")
    index.add_argument("--path", default=str(DEFAULT_ROOT))
    index.add_argument("--force", action="store_true", help="Run a full re-index")
    index.set_defaults(func=command_index)

    list_cmd = sub.add_parser("list", help="List indexed repositories")
    list_cmd.set_defaults(func=command_list)

    search = sub.add_parser("search", help="Search indexed file contents")
    search.add_argument("query")
    search.add_argument("--repo", default=DEFAULT_REPO)
    search.add_argument("--file-pattern")
    search.add_argument("--max-results", type=int, default=20)
    search.add_argument("--context-lines", type=int, default=0)
    search.add_argument("--regex", action="store_true")
    search.set_defaults(func=command_search)

    symbols = sub.add_parser("symbols", help="Search indexed symbols")
    symbols.add_argument("query")
    symbols.add_argument("--repo", default=DEFAULT_REPO)
    symbols.add_argument("--kind")
    symbols.add_argument("--max-results", type=int, default=20)
    symbols.set_defaults(func=command_symbols)

    blast = sub.add_parser("blast", help="Show import/text blast radius for a symbol")
    blast.add_argument("symbol")
    blast.add_argument("--repo", default=DEFAULT_REPO)
    blast.add_argument("--depth", type=int, default=1)
    blast.set_defaults(func=command_blast)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        return args.func(args)
    except ModuleNotFoundError as error:
        print(
            "jcodemunch_mcp is not importable. Run this script with the "
            "jcodemunch virtualenv Python at "
            "/Users/mahesha/.gemini/antigravity/jcodemunch-env/bin/python.",
            file=sys.stderr,
        )
        print(f"Missing module: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
