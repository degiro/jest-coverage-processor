# jest-coverage-processor
Utils for working with Jest coverage data (auto update thresholds, etc.)

## Installation
```shell
npm i jest-coverage-processor --save-dev
```

## updateThresholds
* Update your Jest config:

```js
// package.json
jest: {
  // ...
  "testResultsProcessor": "<rootDir>/test-results-processor.js"
}
```

* Add a test processor script:

```js
// <rootDir>/test-results-processor.js
const {updateThresholds} = require('jest-coverage-processor');

module.exports = function (results) {
   return updateThresholds(results);
};
```
