# Contributing to GrottoCenter Front

Welcome! This guide covers everything you need to set up your environment and contribute to the project.

For coding conventions, architecture, and domain vocabulary, see [AGENTS.md](AGENTS.md).

---

## Prerequisites

- **Node.js** ≥ 18 (recommended: 20)
- **Yarn** 4.5.0 (exactly — defined in `packageManager`)
- **OS**: Windows, macOS, Linux

```bash
yarn          # install dependencies
yarn start    # start the dev server on port 3000
```

---

## IDE Setup

### Recommended IDEs

- **VSCode** (recommended)
- **WebStorm**

### VSCode Extensions

- [Prettier - Code formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [ES7+ React/Redux/React-Native snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

---

## Browser Extensions

Essential for development:

**React Developer Tools**

- Firefox: <https://addons.mozilla.org/en-US/firefox/addon/react-devtools/>
- Chrome: <https://chrome.google.com/webstore/detail/react-developer-tools>

**Redux DevTools**

- Firefox: <https://addons.mozilla.org/en-US/firefox/addon/reduxdevtools/>
- Chrome: <https://chrome.google.com/webstore/detail/redux-devtools>

---

## Contribution Workflow

1. **Create a branch** from `develop`:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/my-feature
   ```

2. **Develop and commit** (Husky hooks run automatically):

   ```bash
   git add src/components/MyComponent.jsx
   git commit -m "feat(MyComponent): add new feature"
   ```

3. **Push and open a PR** targeting `develop`:

   ```bash
   git push origin feat/my-feature
   ```

4. **CI checks** run automatically:
   - ESLint
   - E2E tests (Cypress on Firefox & Chrome)
   - App build
   - Azure staging deployment

Use the PR template at `.github/pull_request_template.md`.
