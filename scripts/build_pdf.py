import subprocess
import sys
from pathlib import Path

# Resolve repo root reliably
ROOT_DIR = Path(__file__).resolve().parent.parent
DOCS_DIR = ROOT_DIR / "docs"

docs = [
    DOCS_DIR / "technical_design.tex",
    DOCS_DIR / "testcases.tex",
]

for tex_file in docs:
    if not tex_file.exists():
        print(f"❌ Error: {tex_file} does not exist.")
        sys.exit(1)

    workdir = tex_file.parent
    tex_name = tex_file.name

    print(f"📄 Building {tex_name}...")

    commands = [
        ["pdflatex", "-interaction=nonstopmode", tex_name],
        ["pdflatex", "-interaction=nonstopmode", tex_name],
    ]

    for cmd in commands:
        result = subprocess.run(cmd, cwd=workdir)
        if result.returncode != 0:
            print(f"❌ LaTeX build failed for {tex_name}")
            sys.exit(1)

    print(f"✅ Finished {tex_name}\n")

print("🎉 All PDFs generated successfully")
