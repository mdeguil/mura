# Contributing to Mura

Thank you for your interest in contributing to Mura! 🎉

## How to contribute

### Reporting bugs

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) when opening an issue.

### Suggesting features

Use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) to suggest new ideas.

### Submitting a Pull Request

1. Fork the repository
2. Create a branch from `main`: `git checkout -b feat/my-feature`
3. Make your changes following the conventions below
4. Write or update tests
5. Commit using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`...
6. Push and open a Pull Request against `main`

## Branch naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/` | `feat/card-due-date` |
| Bug fix | `fix/` | `fix/board-drag-drop` |
| Docs | `docs/` | `docs/api-setup` |
| Chore | `chore/` | `chore/update-deps` |

## Code style

- **Backend**: Follow standard Java conventions, use Lombok where appropriate
- **Frontend**: ESLint + Prettier (run `npm run lint` before committing)

## Development setup

See [docs/setup.md](docs/setup.md) for detailed instructions.

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
