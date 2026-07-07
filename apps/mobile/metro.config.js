// Metro (Expo's bundler) needs extra configuration in a pnpm workspace: by default it
// only looks at this app's own node_modules, but workspace packages (@hgi/*) live under
// the monorepo root and are symlinked in via pnpm. See:
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
// NOTE: deliberately NOT setting disableHierarchicalLookup — that option is meant for
// Yarn/npm-hoisted monorepos where the ordinary upward node_modules walk finds duplicate
// or wrong copies. pnpm already isolates each package's own dependencies via symlinks,
// so hierarchical lookup must stay enabled or Metro can't find packages (e.g.
// expo-modules-core) inside their declaring package's own node_modules.
config.resolver.unstable_enableSymlinks = true;

module.exports = config;
