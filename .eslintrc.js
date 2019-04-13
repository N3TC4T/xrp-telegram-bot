module.exports = {
    parserOptions: {
        ecmaVersion: 2017,
    },
    env: {
        es6: true,
    },
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': ['error'],
        'max-len': [2, 120],
    },
};
