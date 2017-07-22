module.exports = function(wallaby){
    process.env = {PATH: process.env.PATH};

    return {
        files: [
            './package.json',
            './eventEmitter.js',
            './halfcab.js',
            '!./test.js',
        ],
        testFramework: 'mocha',
        tests: [
            './test.js'
        ],
        filesWithNoCoverageCalculated: ['./package.json', 'node_modules/*'],
        env: {
            type: 'node'
        },
        preprocessors: {
            '**/*.js': [
                file => require('reify/lib/compiler').compile(file.content)
            ]
        },
        setup: () => {
            require('reify');
        }
    };
};