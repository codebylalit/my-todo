// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves CommonJS files used by some deps (e.g., idb)
config.resolver.sourceExts = [...config.resolver.sourceExts, "cjs"];

module.exports = config;
