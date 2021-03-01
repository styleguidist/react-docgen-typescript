const path = require('path');
const docgen = require("./lib/parser");

function fixturePath(componentName) {
  return path.join(__dirname, "src", "__tests__", "data", `${componentName}.tsx`); // it's running in ./temp
}

const res = docgen.parse(fixturePath("FunctionalComponentsWithPropTags"), { shouldIncludePropTagMap: true, shouldExtractValuesFromUnion: true, shouldExtractLiteralValuesFromEnum: true });
console.log(res);