module.exports = {
  presets: ["babel-preset-expo"],
  plugins: [["inline-import", { extensions: [".sql"] }]],
};
