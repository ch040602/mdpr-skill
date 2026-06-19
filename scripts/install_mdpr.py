#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPO_URL = "https://github.com/ch040602/mdpr"
DEFAULT_INSTALL_DIR = ROOT / ".cache" / "mdpr"
REPORT_PATH = ROOT / "reports" / "mdpr-install.json"


def run(cmd: list[str], cwd: Path | None = None) -> str:
    completed = subprocess.run(
        cmd,
        cwd=str(cwd) if cwd else None,
        check=True,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    return completed.stdout.strip()


def fail(message: str) -> None:
    print(f"FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def git_dir(path: Path) -> bool:
    return (path / ".git").exists()


def resolve_existing_source(path: Path) -> dict:
    if not path.exists():
        fail(f"MDPR_SOURCE_DIR does not exist: {path}")
    if not path.is_dir():
        fail(f"MDPR_SOURCE_DIR is not a directory: {path}")

    commit = None
    if git_dir(path):
        try:
            commit = run(["git", "rev-parse", "HEAD"], cwd=path)
        except (subprocess.CalledProcessError, FileNotFoundError):
            commit = None

    return {
        "source": "local",
        "repoUrl": None,
        "installDir": str(path),
        "ref": None,
        "commit": commit,
    }


def ensure_git_checkout(repo_url: str, ref: str, install_dir: Path) -> dict:
    if shutil.which("git") is None:
        fail("git is required to install MDPR automatically")

    install_dir.parent.mkdir(parents=True, exist_ok=True)

    if install_dir.exists() and not git_dir(install_dir):
        fail(f"MDPR install path exists but is not a git checkout: {install_dir}")

    if not install_dir.exists():
        clone_cmd = ["git", "clone", "--depth", "1"]
        if ref != "HEAD":
            clone_cmd.extend(["--branch", ref])
        clone_cmd.extend([repo_url, str(install_dir)])
        run(clone_cmd)
    else:
        run(["git", "fetch", "--depth", "1", "origin", ref], cwd=install_dir)
        if ref == "HEAD":
            run(["git", "pull", "--ff-only"], cwd=install_dir)
        else:
            run(["git", "checkout", "FETCH_HEAD"], cwd=install_dir)

    commit = run(["git", "rev-parse", "HEAD"], cwd=install_dir)
    return {
        "source": "git",
        "repoUrl": repo_url,
        "installDir": str(install_dir),
        "ref": ref,
        "commit": commit,
    }


def package_manager_install(path: Path) -> dict:
    if (path / "pnpm-lock.yaml").exists():
        exe = shutil.which("pnpm")
        manager = "pnpm"
        if exe is None:
            fail("pnpm is required to install MDPR dependencies")
        cmd = [exe, "install", "--frozen-lockfile"]
    elif (path / "yarn.lock").exists():
        exe = shutil.which("yarn")
        manager = "yarn"
        if exe is None:
            fail("yarn is required to install MDPR dependencies")
        cmd = [exe, "install", "--frozen-lockfile"]
    elif (path / "package-lock.json").exists():
        exe = shutil.which("npm")
        manager = "npm"
        if exe is None:
            fail("npm is required to install MDPR dependencies")
        cmd = [exe, "ci"]
    elif (path / "package.json").exists():
        exe = shutil.which("npm")
        manager = "npm"
        if exe is None:
            fail("npm is required to install MDPR dependencies")
        cmd = [exe, "install"]
    else:
        return {"dependencyInstall": "skipped", "reason": "no package.json or lockfile found"}

    run(cmd, cwd=path)
    return {"dependencyInstall": "completed", "packageManager": manager, "command": " ".join(cmd)}


def write_report(report: dict) -> None:
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def build_report(base: dict, with_deps: bool) -> dict:
    install_dir = Path(base["installDir"])
    report = {
        **base,
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "hasPackageJson": (install_dir / "package.json").is_file(),
        "hasReadme": any((install_dir / name).is_file() for name in ["README.md", "readme.md", "Readme.md"]),
        "purpose": "MDPR content splitting runtime for this visual diversification skill pack",
        "withDependencies": with_deps,
    }
    if with_deps:
        report.update(package_manager_install(install_dir))
    else:
        report["dependencyInstall"] = "skipped"
        report["reason"] = "use npm run install:mdpr to install MDPR package dependencies"
    return report


def check_install(source_dir: Path | None, install_dir: Path) -> None:
    target = source_dir or install_dir
    if not target.exists():
        fail(f"MDPR is not installed at {target}")
    if source_dir is None and not git_dir(target):
        fail(f"MDPR install directory is not a git checkout: {target}")
    print(f"MDPR install check passed: {target}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Install or verify the MDPR source used by this visual diversification skill pack.")
    parser.add_argument("--check", action="store_true", help="Verify that MDPR is available without changing files.")
    parser.add_argument("--with-deps", action="store_true", help="Install MDPR package dependencies after preparing the source checkout.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if os.environ.get("MDPR_SKIP_INSTALL") == "1" and not args.check:
        print("MDPR install skipped because MDPR_SKIP_INSTALL=1")
        return

    source_dir = os.environ.get("MDPR_SOURCE_DIR")
    source_path = Path(source_dir).expanduser().resolve() if source_dir else None
    install_dir = Path(os.environ.get("MDPR_INSTALL_DIR", str(DEFAULT_INSTALL_DIR))).expanduser().resolve()

    if args.check:
        check_install(source_path, install_dir)
        return

    if source_path:
        base = resolve_existing_source(source_path)
    else:
        repo_url = os.environ.get("MDPR_REPO_URL", DEFAULT_REPO_URL)
        ref = os.environ.get("MDPR_REF", "HEAD")
        base = ensure_git_checkout(repo_url, ref, install_dir)

    report = build_report(base, args.with_deps)
    write_report(report)
    print(f"MDPR prepared at {report['installDir']}")
    print(f"Install report written to {REPORT_PATH}")


if __name__ == "__main__":
    main()
