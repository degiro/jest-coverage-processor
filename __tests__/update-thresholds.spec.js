jest.mock('fs');
const {writeFileSync, readFileSync} = require('fs');
const updateThresholds = require('../src/update-thresholds');

describe('updateThresholds()', () => {
    afterEach(() => {
        readFileSync.mockClear();
        writeFileSync.mockClear();
    });

    afterAll(() => {
        jest.resetModules();
    });

    it('should check if coverageMap is available', () => {
        const jestResults = {};
        const result = updateThresholds(jestResults, {});

        expect(result).toBe(jestResults);
        expect(readFileSync).toHaveBeenCalledTimes(0);
        expect(writeFileSync).toHaveBeenCalledTimes(0);
    });

    it('should init global coverage thresholds if they are missing', () => {
        const jestResults = {
            coverageMap: {
                getCoverageSummary: () => ({
                    toJSON: () => ({
                        statements: {
                            covered: 6,
                            total: 22
                        },
                        branches: {
                            covered: 3,
                            total: 14
                        },
                        functions: {
                            covered: 1,
                            total: 2
                        },
                        lines: {
                            covered: 6,
                            total: 19
                        }
                    })
                })
            }
        };

        readFileSync.mockImplementationOnce(() => '{}');
        updateThresholds(jestResults, {
            packagePath: '../package.json'
        });

        expect(readFileSync).toHaveBeenLastCalledWith('../package.json', 'utf8');
        expect(writeFileSync).toHaveBeenLastCalledWith('../package.json', JSON.stringify({
            jest: {
                coverageThreshold: {
                    global: {
                        statements: 27.27,
                        branches: 21.42,
                        functions: 50,
                        lines: 31.57
                    }
                }
            }
        }, null, 2));
    });

    it('should update global coverage thresholds', () => {
        const jestResults = {
            coverageMap: {
                getCoverageSummary: () => ({
                    toJSON: () => ({
                        statements: {
                            covered: 6,
                            total: 22
                        },
                        branches: {
                            covered: 7,
                            total: 14
                        },
                        functions: {
                            covered: 0,
                            total: 2
                        },
                        lines: {
                            covered: 11,
                            total: 19
                        }
                    })
                })
            }
        };

        readFileSync.mockImplementationOnce(() => JSON.stringify({
            jest: {
                coverageThreshold: {
                    global: {
                        statements: 27.27,
                        branches: 21.42,
                        functions: 50,
                        lines: 31.57
                    }
                }
            }
        }, null, 2));
        updateThresholds(jestResults, {
            packagePath: '../package.json'
        });

        expect(readFileSync).toHaveBeenLastCalledWith('../package.json', 'utf8');
        expect(writeFileSync).toHaveBeenLastCalledWith('../package.json', JSON.stringify({
            jest: {
                coverageThreshold: {
                    global: {
                        statements: 27.27,
                        branches: 50,
                        functions: 50,
                        lines: 57.89
                    }
                }
            }
        }, null, 2));
    });
});