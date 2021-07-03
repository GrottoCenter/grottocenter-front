module.exports = {
  babel: {
    plugins: [
      '@babel/plugin-proposal-logical-assignment-operators',
      '@babel/plugin-proposal-nullish-coalescing-operator'
    ]
  },
  webpack: {
    configure: {
      devtool: 'eval-source-map'
    }
  }
};
