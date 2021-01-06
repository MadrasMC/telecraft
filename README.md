# Telecraft

Pluggable Minecraft server bridge and administration tools.

## Introduction

`// Todo(mkr): Documentation`

## How to use this monorepo

If you're here to read about a specific package, find it in `packages/`.

If you're trying to get involved with or tinker with the Telecraft project, read on.

Get [`pnpm`](https://pnpm.js.org/en/installation). `pnpm` is a fast, disk efficient package manager; usually a drop-in replacement to npm, but this repository is a monorepo. It manages multiple packages simultaneously by taking advantage of pnpm's workspace support.

Quick setup:

```bash
# Get pnpm
npm i -g pnpm

# install node modules for all packages
pnpm recursive install

# run typescript build on all packages, so they're ready to go
pnpm build -r

# if you're actively developing, you'll want to run build in watch mode
pnpm build:w -r --parallel
```

Now you're ready to go tinker with the packages and TypeScript will automatically build as you edit files! Packages within the monorepo are automatically linked by the `workspace:` protocol. Before publishing, pnpm will automatically convert them to the correct versions of those packages.

To update node modules used in all packages across the entire workspace, use `pnpm recursive install typescript@latest` from the root. The root repo is never meant to be published.

### Do not:

- Use npm, yarn, or another package manager in the root repo or any of the packages
- Install package specific modules from the root with or without recursive. cd into the package and install them.

### Do:

- Use `pnpm install @telecraft/parser@workspace:*` to add one package from this repo as a dependency to another
