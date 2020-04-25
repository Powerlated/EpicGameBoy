const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
    entry: {
        index: './src/webpack-entry.ts',
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new CopyPlugin([
            { from: './src/roms.js', },
            { from: './src/bootrom.js', },
            { from: './src/ProggyClean.ttf' },
            { from: './src/index.css' }
        ]),
        new CircularDependencyPlugin({
            // exclude detection of files based on a RegExp
            exclude: /a\.js|node_modules/,
            // include specific files based on a RegExp
            include: /core/,
            // add errors to webpack instead of warnings
            failOnError: true,
            // allow import cycles that include an asyncronous import,
            // e.g. via import(/* webpackMode: "weak" */ './file.js')
            allowAsyncCycles: false,
            // set the current working directory for displaying module paths
            cwd: process.cwd(),
        })
    ],
    performance: { hints: false },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'],
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    externals: {
        localforage: 'localforage'
    },
    optimization: {
        usedExports: false
    },
    devServer: {
        hot: false,
        inline: false,
    }
};
