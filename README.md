# Vaults Diagram Tools Action

Render Mermaid assets, generate source-code diagrams, and validate Markdown diagram policy in GitHub Actions using [`vaults-diagram-tools`](https://github.com/Malnati/vaults-diagram-tools).

This repository is the dedicated GitHub Actions Marketplace wrapper for the npm package. It keeps `action.yml` at the repository root and does not include workflow files.

## Usage

### Render Mermaid to SVG/JPEG

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Render Mermaid assets
    id: diagrams
    uses: Malnati/vaults-diagram-tools-action@v0
    with:
      mode: render
      input: docs/diagrams/flowchart.mmd
      output-dir: docs/diagrams/rendered
```

### Generate diagrams from source code

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Generate source diagrams
    id: source-diagrams
    uses: Malnati/vaults-diagram-tools-action@v0
    with:
      mode: source
      source-dir: src
      output-dir: docs/source-diagrams
      args: |
        --langs
        auto
        --diagrams
        dependency,class
```

### Validate Markdown diagram policy

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Validate diagram policy
    uses: Malnati/vaults-diagram-tools-action@v0
    with:
      mode: policy
      input: docs
```

### Upload generated assets

```yaml
steps:
  - uses: actions/checkout@v4
  - name: Render Mermaid assets
    id: diagrams
    uses: Malnati/vaults-diagram-tools-action@v0
    with:
      mode: render
      input: docs/diagrams
      output-dir: diagram-assets
  - name: Upload diagram assets
    uses: actions/upload-artifact@v4
    with:
      name: diagram-assets
      path: ${{ steps.diagrams.outputs.output-dir }}
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `mode` | `render` | `render`, `source`, or `policy`. |
| `input` | | Mermaid file/directory for `render`; Markdown file/directory for `policy`. |
| `source-dir` | | Source root for `source` mode. |
| `output-dir` | `vaults-diagram-tools-output` | Output directory for generated files. |
| `manifest` | mode-specific | Manifest path. Render defaults to `render-manifest.json`; source defaults to `manifest.json`. |
| `package-version` | `auto` | npm version for `vaults-diagram-tools`; `auto` resolves to this action release default. |
| `node-version` | `20` | Node.js version installed with `actions/setup-node`. |
| `args` | | Extra CLI arguments, one argument per line. No shell `eval` is used. |

## Outputs

| Output | Description |
| --- | --- |
| `output-dir` | Absolute output directory for `render` and `source` modes. |
| `manifest` | Absolute manifest path for `render` and `source` modes. |
| `command` | Command executed by the action. |

## Versioning

- `v0` tracks the latest compatible `0.x` action release.
- `v0.1.4` uses `vaults-diagram-tools@0.1.4` by default.
- Set `package-version` explicitly for fully pinned npm runtime behavior.

## Local smoke test

```bash
scripts/smoke.sh
```

The smoke test runs render, source, and policy modes against local fixtures.

## Marketplace publication

Publish releases from the GitHub UI with **Publish this Action to the GitHub Marketplace** enabled.

Recommended Marketplace categories:

- Primary: Utilities
- Secondary: Code quality

## License

MIT. See [LICENSE](LICENSE).
