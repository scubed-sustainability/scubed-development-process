const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
          exclude: [
            /node_modules/,
            /\.vscode-test/,
            /dist/,
            /out/,
          ],
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: !isProduction, // Faster dev builds
                compilerOptions: {
                  sourceMap: !isProduction
                }
              }
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
      // No splitChunks for VS Code extensions - single bundle required
    },
    
    devtool: isProduction ? 'hidden-source-map' : 'nosources-source-map',
    
    infrastructureLogging: {
      level: "log"
    },
    
    // 🟢 GREEN: Performance optimizations
    performance: {
      hints: isProduction ? 'warning' : false,
      maxEntrypointSize: 500 * 1024, // 500 KiB - more realistic for VS Code extensions
      maxAssetSize: 500 * 1024
    },
    
    // Copy template files to dist directory
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, 'templates'),
            to: path.resolve(__dirname, 'dist', 'templates'),
            noErrorOnMissing: false
          }
        ]
      })
    ]
  };
};