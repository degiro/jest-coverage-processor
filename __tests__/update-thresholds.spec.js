jest.mock('fs');
const {writeFileSync, readFileSync} = require('fs');
const updateThresholds = require('../src/update-thresholds');

describe('updateThresholds()', () => {
    const jestConfigRelativePath = '../jest.config.js';
    const jestConfigAbsolutePath = require.resolve(jestConfigRelativePath);

    beforeEach(() => {
        jest.resetModules();
        jest.doMock(jestConfigRelativePath, () => ({coverageThreshold: {}}));
        readFileSync.mockClear();
        writeFileSync.mockClear();
    });

    it('should check if coverageMap is available', () => {
        const jestResults = {};
        const result = updateThresholds(jestResults, {});

        expect(result).toBe(jestResults);
        expect(writeFileSync).toHaveBeenCalledTimes(0);
    });

    it('should init global coverage thresholds if they are missing', () => {
        const jestResults = {
            success: true,
            coverageMap: {
                getCoverageSummary: () => ({
                    toJSON: () => ({
                        statements: {
                            pct: 27.27
                        },
                        branches: {
                            pct: 21.42
                        },
                        functions: {
                            pct: 50
                        },
                        lines: {
                            pct: 31.57
                        }
                    })
                })
            }
        };

        readFileSync.mockReturnValue('module.exports = {coverageThreshold: {}};');
        updateThresholds(jestResults, {
            configPath: jestConfigRelativePath
        });
        const thresholdsJson = JSON.stringify({
            global: {
                statements: 27.27,
                branches: 21.42,
                functions: 50,
                lines: 31.57
            }
        }, null, 4);

        expect(readFileSync).toHaveBeenCalledWith(jestConfigAbsolutePath, 'utf8');
        expect(writeFileSync).toHaveBeenCalledWith(
            jestConfigAbsolutePath,
            `module.exports = {coverageThreshold: ${thresholdsJson}};`
        );
    });

    it('should update global coverage thresholds', () => {
        const jestResults = {
            success: true,
            coverageMap: {
                getCoverageSummary: () => ({
                    toJSON: () => ({
                        statements: {
                            pct: 30
                        },
                        branches: {
                            pct: 20
                        },
                        functions: {
                            pct: 50
                        },
                        lines: {
                            pct: 40
                        }
                    })
                })
            }
        };
        const thresholds = {
            global: {
                statements: 20,
                branches: 50,
                functions: 40,
                lines: 30
            }
        };

        jest.doMock(jestConfigRelativePath, () => ({
            coverageThreshold: thresholds
        }));
        readFileSync.mockReturnValue(`module.exports = { coverageThreshold: ${JSON.stringify(thresholds)} };`);

        updateThresholds(jestResults, {
            configPath: jestConfigRelativePath
        });
        const thresholdsJson = JSON.stringify({
            global: {
                statements: 30,
                branches: 50,
                functions: 50,
                lines: 40
            }
        }, null, 4);

        expect(readFileSync).toHaveBeenCalledWith(jestConfigAbsolutePath, 'utf8');
        expect(writeFileSync).toHaveBeenCalledWith(
            jestConfigAbsolutePath,
            `module.exports = { coverageThreshold: ${thresholdsJson} };`
        );
    });
});