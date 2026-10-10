# PaperInk Advertising Agencies

[![CI](https://github.com/mokoenasiphiwe23-droid/PaperInk-advertising-agencies-/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/mokoenasiphiwe23-droid/PaperInk-advertising-agencies-/actions/workflows/test.yml)

A starting point for PaperInk’s advertising-agency project.

## Overview

This repository is an initial project scaffold. It is intended to become the home for the project’s source code, documentation, tests, and supporting assets.

## Project structure

```text
.
├── docs/       # Project documentation and planning notes
├── src/        # Application or library source code
├── tests/      # Automated tests
├── .gitignore  # Files excluded from version control
├── LICENSE     # Apache License 2.0
└── README.md   # Project overview and setup notes
```

## Core tools

The initial core module in `src/agency.js` provides small, dependency-free building blocks for managing agency operations:

- `createAgency()` creates an agency workspace.
- `addClient()` adds a client with validation and duplicate protection.
- `createCampaign()` creates a campaign for a known client.
- `getAgencySummary()` returns client, campaign, and budget totals.

Run the test suite with:

```bash
npm test
```

## Getting started

The project is currently in its initial setup phase. Add implementation files under `src/`, tests under `tests/`, and supporting documentation under `docs/` as development begins.

## Development workflow

1. Create a feature branch from `main`.
2. Add or update code under `src/`.
3. Add tests under `tests/`.
4. Update documentation in `README.md` or `docs/`.
5. Open a pull request for review.

## Status

Initial scaffold created. Setup instructions and implementation details will be expanded as the project develops.

## License

This project is licensed under the Apache License 2.0. See [LICENSE](LICENSE) for the full license text.
