# Contribution Guidelines

## Update dependencies before new feature development

1. Update flake lock: `nix flake update`
2. Check the nodejs version, and update it in Dockerfile.
3. Update npm dependencies: `pnpm dlx npm-check-updates -u`
