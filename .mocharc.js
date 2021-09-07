
module.exports = {
  "require": [
    "ts-node/register",
    "tsconfig-paths/register",
    "jsdom-global/register"
  ],
  "extension": [ "ts", "tsx" ],
  "spec": [
    "./test/**/*.test.ts",
    "./test/**/*.test.tsx"
  ]
}
