const path = require('path');

module.exports = {
  target: 'node',
  mode: 'none', // VS Code extension loading
  
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  
  externals: {
    vscode: 'commonjs vscode' // VS Code API is external
  },
  
  resolve: {
    extensions: ['.ts', '.js']
  },
  
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log"
  }
};