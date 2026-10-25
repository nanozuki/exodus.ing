{
  description = "Description for the project";
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    process-compose-flake.url = "github:Platonic-Systems/process-compose-flake";
    services-flake.url = "github:juspay/services-flake";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ inputs.process-compose-flake.flakeModule ];

      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "aarch64-darwin"
        "x86_64-darwin"
      ];
      perSystem =
        {
          config,
          self',
          inputs',
          pkgs,
          system,
          ...
        }:
        {
          # Run the local PostgreSQL service with `nix run .#pg`.
          process-compose.pg = {
            imports = [ inputs.services-flake.processComposeModules.default ];
            cli = {
              preHook = "mkdir -p .direnv";
              options = {
                no-server = false;
                use-uds = true;
                unix-socket = ".direnv/pg.sock";
              };
            };
            defaults.processSettings = { name, ... }: {
              log_location = ".direnv/${name}.log";
            };
            services.postgres.pg = {
              enable = true;
              port = 62545;
              dataDir = ".direnv/pg";
            };
          };

          devShells.default = pkgs.mkShell {
            APP_URL = "http://localhost:5173";
            PGHOST = config.process-compose.pg.services.postgres.pg.listen_addresses;
            PGPORT = toString config.process-compose.pg.services.postgres.pg.port;
            PGDATABASE = "exodus-dev";
            PGPASSWORD = "";
            packages = with pkgs; [
              flyctl
              git
              nodePackages."@tailwindcss/language-server"
              nodePackages.nodejs
              nodePackages.pnpm
              nodePackages.svelte-language-server
              pgcli
              vtsls
            ];
            shellHook = ''
              export ESLINT_USE_FLAT_CONFIG="true"
              export PGUSER="$(id -un)"
            '';
          };
        };
    };
}
