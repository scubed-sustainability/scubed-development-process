const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    target: 'node',
    mode: isProduction ? 'production' : 'development',
    
    entry: './src/extension.ts',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2'
    },
    
    externals: {
      vscode: 'commonjs vscode' // VS Code API is external
    },
    
    // 🟢 GREEN: Optimized resolve configuration for tree shaking
    resolve: {
      extensions: ['.ts', '.js'],
      mainFields: ['module', 'main'], // Prefer ES modules for better tree shaking
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
    
    // 🟢 GREEN: Performance optimizations for bundle size reduction
    optimization: {
      minimize: isProduction,
      usedExports: true, // Tree shaking
      sideEffects: false, // Enable aggressive tree shaking
      mangleExports: isProduction,
      concatenateModules: isProduction,
    },
    
    devtool: isProduction ? 'hidden-source-map' : 'nosources-source-map',
    
    infrastructureLogging: {
      level: "log"
    },
    
    // 🟢 GREEN: Performance optimizations
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 400 * 1024, // 400 KiB target
      maxAssetSize: 400 * 1024
    }
  };
};