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
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'file-loader',
                ],
            },
        ],
    },
    plugins: [
        new CopyPlugin([
            {
                from: './src/roms.js',
            },
            {
                from: './src/ProggyClean.ttf'
            }
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
