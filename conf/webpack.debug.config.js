import path from 'path'
import { fileURLToPath } from 'url'

export default (env, argv) => {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  return {
    mode: 'development',
    entry: './src/orbitdb.js',
    output: {
      filename: '../dist/orbitdb.js',
      library: {
        name: 'OrbitDB',
        type: 'var',
        export: 'default'
      }
    },
    target: 'web',
    devtool: 'source-map',
    externals: {
      fs: '{ existsSync: () => true }',
      mkdirp: '{}'
    },
    resolve: {
      modules: [
        'node_modules',
        path.resolve(__dirname, '../node_modules')
      ]
    },
    resolveLoader: {
      modules: [
        'node_modules',
        path.resolve(__dirname, '../node_modules')
      ],
      extensions: ['.js', '.json'],
      mainFields: ['loader', 'main']
    }
  }
}
