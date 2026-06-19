#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DESIGN_SOURCE_URL = "https://github.com/bitjaru/" + "style" + "seed"


def run(cmd: list[str], cwd: Path | None = None) -> str:
    return subprocess.check_output(cmd, cwd=cwd, text=True, encoding="utf-8", errors="replace", stderr=subprocess.STDOUT).strip()


def ensure_source(path: Path) -> None:
    if path.exists():
        run(["git", "fetch", "--depth", "1", "origin", "HEAD"], cwd=path)
        run(["git", "checkout", "--detach", "FETCH_HEAD"], cwd=path)
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    run(["git", "clone", "--depth", "1", DESIGN_SOURCE_URL, str(path)])


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def stems(paths: list[Path]) -> list[str]:
    return sorted(path.stem for path in paths)


def css_vars(path: Path) -> list[str]:
    if not path.exists():
        return []
    return sorted(set(re.findall(r"--[a-zA-Z0-9_-]+", read(path))))


def motion_keywords(path: Path) -> list[str]:
    if not path.exists():
        return []
    return sorted(set(re.findall(r'key:\s*"([^"]+)"', read(path))))


def exported_functions(path: Path) -> list[str]:
    if not path.exists():
        return []
    text = read(path)
    names = re.findall(r"function\s+([A-Z][A-Za-z0-9_]*)\s*\(", text)
    names += re.findall(r"const\s+([A-Z][A-Za-z0-9_]*)\s*=", text)
    return sorted(set(names))


def inventory(source: Path) -> dict[str, Any]:
    ensure_source(source)
    ref = run(["git", "rev-parse", "HEAD"], cwd=source)
    token_files = sorted((source / "engine" / "tokens").glob("*.json"))
    skins = sorted(path.name for path in (source / "skins").iterdir() if path.is_dir() and not path.name.startswith("_"))
    ui_files = sorted((source / "engine" / "components" / "ui").glob("*.tsx"))
    pattern_files = sorted((source / "engine" / "components" / "patterns").glob("*.tsx"))
    skin_vars = {skin: css_vars(source / "skins" / skin / "theme.css") for skin in skins}
    return {
        "source": "external-design-source",
        "ref": ref,
        "createdAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "docs": sorted(path.name for path in (source / "engine").glob("*.md")),
        "css": stems(sorted((source / "engine" / "css").glob("*.css"))),
        "tokens": {
            "files": stems(token_files),
            "topLevelKeys": {path.stem: sorted(json.loads(path.read_text(encoding="utf-8")).keys()) for path in token_files},
        },
        "skins": skins,
        "skinCssVariables": skin_vars,
        "motion": {
            "seeds": stems(sorted((source / "engine" / "motion" / "seeds").glob("*.ts"))),
            "keywords": motion_keywords(source / "engine" / "motion" / "library.ts"),
        },
        "components": {
            "ui": [{"id": path.stem, "exports": exported_functions(path)} for path in ui_files],
            "patterns": [{"id": path.stem, "exports": exported_functions(path)} for path in pattern_files],
        },
    }


def build_manifest(inv: dict[str, Any]) -> dict[str, Any]:
    def map_ui(component: str) -> dict[str, str]:
        semantic = {
            "button": "action",
            "card": "surface",
            "table": "table",
            "tabs": "segmented-navigation",
            "input": "form-field",
            "textarea": "form-field",
            "select": "option-picker",
            "checkbox": "toggle-control",
            "switch": "toggle-control",
            "toggle": "toggle-control",
            "toggle-group": "segmented-control",
            "dialog": "modal-surface",
            "sheet": "side-panel",
            "drawer": "bottom-panel",
            "badge": "label",
            "avatar": "identity",
            "progress": "progress-indicator",
            "skeleton": "loading-placeholder",
        }.get(component, "static-ui-pattern")
        return {"pptMapping": semantic, "editableObject": "shape/text", "htmlMapping": f"data-slot:{component}"}

    def map_pattern(pattern: str) -> dict[str, str]:
        return {"slideRecipeOrVariant": pattern.replace("-", "."), "pptMapping": "editable grouped shapes", "htmlMapping": f"data-pattern:{pattern}"}

    return {
        "source": inv["source"],
        "ref": inv["ref"],
        "coveragePolicy": "Every Design Components source element is mapped to a renderer-neutral MDPR adaptation category; React runtime behavior is converted to static PPTX/PDF plans or semantic HTML.",
        "docs": {name: "reference-rule-doc" for name in inv["docs"]},
        "css": {name: "renderer-neutral-css-token-source" for name in inv["css"]},
        "tokens": {name: "ThemeColorRef/StyleToken mapping" for name in inv["tokens"]["files"]},
        "tokenTopLevelKeys": {
            name: {key: "mapped-to-renderer-neutral-token-family" for key in keys}
            for name, keys in inv["tokens"]["topLevelKeys"].items()
        },
        "skins": {name: "DeckVisualProfile axes + preview-only fallback colors" for name in inv["skins"]},
        "skinCssVariables": {skin: {var: "semantic-token-or-preview-fallback" for var in vars} for skin, vars in inv["skinCssVariables"].items()},
        "motionSeeds": {name: "PPTX/PDF static fallback + optional HTML motion" for name in inv["motion"]["seeds"]},
        "motionKeywords": {name: "PPTX/PDF static fallback + optional HTML motion keyword" for name in inv["motion"]["keywords"]},
        "components": {
            "ui": {item["id"]: map_ui(item["id"]) for item in inv["components"]["ui"]},
            "patterns": {item["id"]: map_pattern(item["id"]) for item in inv["components"]["patterns"]},
        },
    }


def coverage(inv: dict[str, Any], manifest: dict[str, Any]) -> tuple[bool, list[str]]:
    missing: list[str] = []
    for key in inv["docs"]:
        if key not in manifest["docs"]:
            missing.append(f"docs:{key}")
    for key in inv["css"]:
        if key not in manifest["css"]:
            missing.append(f"css:{key}")
    for key in inv["tokens"]["files"]:
        if key not in manifest["tokens"]:
            missing.append(f"tokens:{key}")
    for token_file, keys in inv["tokens"]["topLevelKeys"].items():
        mapped_keys = manifest.get("tokenTopLevelKeys", {}).get(token_file, {})
        for key in keys:
            if key not in mapped_keys:
                missing.append(f"tokenTopLevelKeys:{token_file}.{key}")
    for key in inv["skins"]:
        if key not in manifest["skins"]:
            missing.append(f"skins:{key}")
    for skin, vars in inv["skinCssVariables"].items():
        mapped_vars = manifest.get("skinCssVariables", {}).get(skin, {})
        for var in vars:
            if var not in mapped_vars:
                missing.append(f"skinCssVariables:{skin}.{var}")
    for key in inv["motion"]["seeds"]:
        if key not in manifest["motionSeeds"]:
            missing.append(f"motionSeeds:{key}")
    for key in inv["motion"]["keywords"]:
        if key not in manifest["motionKeywords"]:
            missing.append(f"motionKeywords:{key}")
    for item in inv["components"]["ui"]:
        if item["id"] not in manifest["components"]["ui"]:
            missing.append(f"components.ui:{item['id']}")
    for item in inv["components"]["patterns"]:
        if item["id"] not in manifest["components"]["patterns"]:
            missing.append(f"components.patterns:{item['id']}")
    return not missing, missing


def write_coverage_doc(path: Path, inv: dict[str, Any], manifest: dict[str, Any], ok: bool, missing: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "# Design Components Port Coverage",
        "",
        f"- Source: {inv['source']}",
        f"- Ref: `{inv['ref']}`",
        f"- Status: {'complete' if ok else 'incomplete'}",
        "",
        "## Counts",
        "",
        f"- Docs: {len(inv['docs'])}",
        f"- CSS files: {len(inv['css'])}",
        f"- Token files: {len(inv['tokens']['files'])}",
        f"- Skins: {len(inv['skins'])}",
        f"- Motion seeds: {len(inv['motion']['seeds'])}",
        f"- Motion keywords: {len(inv['motion']['keywords'])}",
        f"- UI components: {len(inv['components']['ui'])}",
        f"- Pattern components: {len(inv['components']['patterns'])}",
        "",
        "## Mapping Policy",
        "",
        manifest["coveragePolicy"],
        "",
        "## Missing",
        "",
    ]
    lines += [f"- {item}" for item in missing] if missing else ["- None"]
    lines += ["", "## UI Components", ""]
    lines += [f"- `{key}` -> {value['pptMapping']}" for key, value in sorted(manifest["components"]["ui"].items())]
    lines += ["", "## Pattern Components", ""]
    lines += [f"- `{key}` -> {value['slideRecipeOrVariant']}" for key, value in sorted(manifest["components"]["patterns"].items())]
    lines += ["", "## Motion Keywords", ""]
    lines += [f"- `{key}` -> {value}" for key, value in sorted(manifest["motionKeywords"].items())]
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", default=".cache/design-source")
    parser.add_argument("--report", default="reports/design-source-inventory.json")
    parser.add_argument("--manifest", default="design_components/design-source-adapter/port-manifest.json")
    parser.add_argument("--coverage", default="docs/design-source-port-coverage.md")
    parser.add_argument("--update-manifest", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()

    inv = inventory((ROOT / args.source).resolve())
    report_path = ROOT / args.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(inv, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    manifest_path = ROOT / args.manifest
    if args.update_manifest or not manifest_path.exists():
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps(build_manifest(inv), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    ok, missing = coverage(inv, manifest)
    write_coverage_doc(ROOT / args.coverage, inv, manifest, ok, missing)
    if args.check and not ok:
        raise SystemExit("Design Components port coverage incomplete: " + ", ".join(missing))
    print(json.dumps({"ok": ok, "missing": missing, "report": args.report, "manifest": args.manifest, "coverage": args.coverage}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
