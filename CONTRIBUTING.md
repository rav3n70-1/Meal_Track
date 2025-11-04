# Contributing to MealTracker

Thank you for your interest in contributing! We welcome contributions of all kinds: bug fixes, new features, docs, design, and more.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

- Read the [README](README.md) to set up the project
- Use `.env.example` to configure environment variables
- Run the app:
  ```bash
  npm install
  npm run dev
  ```

## Development Guidelines

- Write clear, readable code and meaningful commit messages
- Prefer small, focused Pull Requests
- Include tests where applicable (unit or integration)
- Keep UI accessible and responsive

## Branching Model

- `main`: stable, released code
- feature branches: `feat/<short-name>`
- bugfix branches: `fix/<short-name>`

## Commit Messages

Use conventional commits when possible:
- `feat: add new rent bill calendar`
- `fix: handle null member in debt calculations`
- `docs: update setup guide`

## Pull Requests

1. Fork the repo and create your branch from `main`
2. Ensure build passes locally: `npm run build`
3. Lint and format: `npm run lint` (if available)
4. Describe the change and link related issues
5. Mark breaking changes clearly

## Issues

- Search existing issues before opening a new one
- Use the provided templates for bug reports and feature requests
- Provide steps to reproduce, expected behavior, and screenshots if relevant

## Security

Please do not open public issues for security vulnerabilities. See [SECURITY.md](SECURITY.md) for reporting instructions.

## License

By contributing, you agree your contributions will be licensed under the [MIT License](LICENSE).


