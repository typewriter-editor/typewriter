
module.exports = {
  "require": [
    // "ts-node/register",
    "tsconfig-paths/register",
    "jsdom-global/register"
  ],
  "node-option": ["experimental-specifier-resolution=node", "loader=ts-node/esm"],
  "extension": [ "ts", "tsx" ],
  "spec": [
    "./test/**/*.test.ts",
    "./test/**/*.test.tsx"
  ]
}
