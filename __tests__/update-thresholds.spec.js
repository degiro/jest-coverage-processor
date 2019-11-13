jest.mock('fs');
const {writeFileSync} = require('fs');
const updateThresholds = require('../src/update-thresholds');

describe('updateThresholds()', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.mock('../jest.config.js', () => ({}));
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

        updateThresholds(jestResults, {
            configPath: '../jest.config.js'
        });
        const configSrc = JSON.stringify({
            coverageThreshold: {
                global: {
                    statements: 27.27,
                    branches: 21.42,
                    functions: 50,
                    lines: 31.57
                }
            }
        }, null, 4);

        expect(writeFileSync).toHaveBeenLastCalledWith('../jest.config.js', `module.exports = ${configSrc};`);
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

        jest.mock('../jest.config.js', () => ({
            coverageThreshold: {
                global: {
                    statements: 20,
                    branches: 50,
                    functions: 40,
                    lines: 30
                }
            }
        }));
        updateThresholds(jestResults, {
            configPath: '../jest.config.js'
        });
        const configSrc = JSON.stringify({
            coverageThreshold: {
                global: {
                    statements: 30,
                    branches: 50,
                    functions: 50,
                    lines: 40
                }
            }
        }, null, 4);

        expect(writeFileSync).toHaveBeenLastCalledWith('../jest.config.js', `module.exports = ${configSrc};`);
    });
});