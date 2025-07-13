{
  description = "Description for the project";
  inputs = {
    flake-parts.url = "github:hercules-ci/flake-parts";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [ "x86_64-linux" "aarch64-linux" "aarch64-darwin" "x86_64-darwin" ];
      perSystem = { config, self', inputs', pkgs, system, ... }: {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            just
            nodePackages."@tailwindcss/language-server"
            nodePackages.nodejs
            nodePackages.pnpm
            nodePackages.svelte-language-server
            pgcli
          ];
          shellHook = ''
            export ESLINT_USE_FLAT_CONFIG="true"
          '';
        };
      };
    };
}
