# 2026 hardware platform configuration management overview

An overview of Mozilla RelOps platform deployments.

Initially focusing on how we deploy our hardware platforms.

## Viewing and Development

View the [deployed static presentation](https://mozilla-platform-ops.github.io/presentations/drafts/2026-hardware-platform-configuration-managment-overview/#/1).

The slides are in Markdown format, so if you just want to read the content, open `slides.md` directly.

For the rich presentation viewer, use Slidev.

### Prerequisites

Install Bun:

macOS/Linux:

```bash
curl -fsSL https://bun.sh/install | bash
```

Windows (PowerShell):

```powershell
powershell -c "irm bun.sh/install.ps1 | iex"
```

After installation, restart your shell (or source your shell profile on macOS/Linux) so `bun` is on your `PATH`.

```bash
bun --version
```

### Install Slidev

Uses Slidev (https://sli.dev/).

```bash
bun install
```

### Run the Deck

From this directory:

```bash
bun run dev
```

Follow the on-screen directions to view the slides.

### Build the Deck

Build the static viewer for GitHub Pages:

```bash
bun run build
```

The build uses Slidev's hash router mode and patches generated asset paths so the deck can be served from a nested GitHub Pages path.

The GitHub Pages deployment publishes the deck under:

```text
/presentations/drafts/2026-hardware-platform-configuration-managment-overview/
```

Presenter mode is available under the same deck URL:

```text
/presentations/drafts/2026-hardware-platform-configuration-managment-overview/#/presenter/1
```

Build a local static viewer without the GitHub Pages base path:

```bash
bun run build:local
```

Export a PDF:

```bash
bun run export
```

### GitHub Pages

This repository includes a GitHub Actions workflow that builds and deploys the deck to GitHub Pages on pushes to `main`.

The root Pages URL lists available presentation directories. This draft deck is published under its `drafts/` path.

In GitHub, configure the repository's Pages source to use **GitHub Actions**.

### Slidev Docs

https://sli.dev/guide/
