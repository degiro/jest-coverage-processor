const {writeFileSync} = require('fs');

/**
 * @description Update test coverage thresholds. https://github.com/facebook/jest/issues/3710
 * @param {*} jestResults
 * @returns {*}
 */
module.exports = function updateThresholds (jestResults, options) {
    const {coverageMap} = jestResults;

    // 1. update thresholds only after successful run
    // 2. check if coverage is enabled
    if (!jestResults.success || !coverageMap) {
        return jestResults;
    }
    const {configPath, outputSpaces = '    '} = options;
    const jestConfig = require(configPath);
    const metrics = [
        'statements',
        'branches',
        'functions',
        'lines'
    ];

    if (!jestConfig.coverageThreshold) {
        jestConfig.coverageThreshold = {};
    }

    if (!jestConfig.coverageThreshold.global) {
        jestConfig.coverageThreshold.global = metrics.reduce((thresholds, coverageMetric) => {
            thresholds[coverageMetric] = 0;
            return thresholds;
        }, {});
    }

    const actualCoverage = coverageMap.getCoverageSummary().toJSON();
    const thresholds = jestConfig.coverageThreshold.global;

    metrics.forEach((coverageMetric) => {
        const coverageData = actualCoverage[coverageMetric];
        const coveragePercentage = coverageData.pct || 0;
        const threshold = thresholds[coverageMetric] || 0;

        // save new coverage threshold if it increased
        if (coveragePercentage > threshold) {
            thresholds[coverageMetric] = coveragePercentage;
        }
    });

    // it's added by require() call
    delete jestConfig.rootDir;

    writeFileSync(configPath, `module.exports = ${JSON.stringify(jestConfig, null, outputSpaces)};`);

    return jestResults;
};