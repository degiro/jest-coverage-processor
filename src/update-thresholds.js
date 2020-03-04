const {writeFileSync, readFileSync} = require('fs');

function updateJestConfigFile ({jestConfigPath, jestConfig, outputSpaces}) {
    const jestConfigSource = readFileSync(jestConfigPath, 'utf8');
    const {index: coverageThresholdStart} = /coverageThreshold\s*:/.exec(jestConfigSource) || {index: -1};
    let coverageThresholdEnd = coverageThresholdStart;
    let openedBracketsCount;

    for (; coverageThresholdEnd < jestConfigSource.length; coverageThresholdEnd++) {
        const char = jestConfigSource[coverageThresholdEnd];

        if (char === '{') {
            openedBracketsCount = (openedBracketsCount || 0) + 1;
        } else if (char === '}') {
            openedBracketsCount = (openedBracketsCount || 0) - 1;
        }

        if (openedBracketsCount === 0) {
            break;
        }
    }

    if (coverageThresholdStart === -1 || coverageThresholdEnd === jestConfigSource.length) {
        throw new Error(`coverageThreshold section could not be updated in ${jestConfigPath}`);
    }
    const coverageThresholdJson = JSON.stringify(jestConfig.coverageThreshold, null, outputSpaces);
    const updatedJestConfigSource = [
        jestConfigSource.slice(0, coverageThresholdStart),
        `coverageThreshold: ${coverageThresholdJson}`,
        jestConfigSource.slice(coverageThresholdEnd + 1)
    ].join('');

    writeFileSync(jestConfigPath, updatedJestConfigSource);
}

/**
 * @description Update test coverage thresholds. https://github.com/facebook/jest/issues/3710
 * @param {object} jestResults
 * @param {object} options
 * @param {string} options.configPath
 * @param {string|number} [options.outputSpaces]
 * @returns {object}
 */
module.exports = function updateThresholds (jestResults, options) {
    const {coverageMap} = jestResults;

    // 1. update thresholds only after successful run
    // 2. check if coverage is enabled
    if (!jestResults.success || !coverageMap) {
        return jestResults;
    }
    const {outputSpaces = 4} = options;
    const jestConfigPath = require.resolve(options.configPath);
    const jestConfig = require(jestConfigPath);
    const metrics = [
        'statements',
        'branches',
        'functions',
        'lines'
    ];

    if (!jestConfig.coverageThreshold) {
        throw new Error(`coverageThreshold section is not found in ${jestConfigPath}`);
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

    updateJestConfigFile({
        jestConfig,
        jestConfigPath,
        outputSpaces
    });

    return jestResults;
};