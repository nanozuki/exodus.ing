// Keep command permissions in administrator configuration, outside the
// dependency branches that Renovate checks out and updates.

module.exports = {
  platform: 'github',
  onboarding: false,
  requireConfig: 'required',
  binarySource: 'global',
  allowedCommands: ['^nix develop --command node src/scripts/sync-node-version\\.ts --write$'],
};
