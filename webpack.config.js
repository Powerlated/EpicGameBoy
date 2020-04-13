const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        index: './src/webpack-entry.js',
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
