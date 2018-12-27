const {writeFileSync, readFileSync} = require('fs');

/**
 * @description Update test coverage thresholds. https://github.com/facebook/jest/issues/3710
 * @param {*} jestResults
 * @returns {*}
 */
module.exports = function updateThresholds (jestResults, options) {
    const {coverageMap} = jestResults;
    const {packagePath, thresholdPrecision = 2, outputSpaces = '  '} = options;

    // check if coverage is enabled
    if (coverageMap) {
        /**
         * @description Do not use require(), because it adds rootDir variable to JEST config
         * @type {any}
         */
        const packageInfo = JSON.parse(readFileSync(packagePath, 'utf8'));
        const jestConfig = packageInfo.jest || {};

        if (!jestConfig.coverageThreshold) {
            jestConfig.coverageThreshold = {};
        }

        packageInfo.jest = jestConfig;
        const {coverageThreshold} = jestConfig;
        const actualCoverage = coverageMap.getCoverageSummary().toJSON();
        const thresholds = coverageThreshold.global || {};

        [
            'statements',
            'branches',
            'functions',
            'lines'
        ].forEach((coverageMetric) => {
            const coverageData = actualCoverage[coverageMetric];

            /**
             * @description Round percents
             * @type {number}
             */
            const multiplier = Math.pow(10, thresholdPrecision);
            const coveragePercentage =
                Math.floor(100 * multiplier * coverageData.covered / coverageData.total) / multiplier;
            const threshold = Math.abs(thresholds[coverageMetric] || 0);

            // save new coverage threshold if it increased
            if (coveragePercentage > threshold) {
                Object.assign(coverageThreshold, {
                    global: Object.assign({}, coverageThreshold.global, {
                        [coverageMetric]: coveragePercentage
                    })
                });
            }
        });

        writeFileSync(packagePath, JSON.stringify(packageInfo, null, outputSpaces));
    }

    return jestResults;
};
