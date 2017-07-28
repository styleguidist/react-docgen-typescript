import { assert } from 'chai';
import * as path from 'path';
import { parse } from "../propTypesParser2";


describe('new parser', () => {
    it.only('should parse', () => {
        const fileName = path.join(__dirname, '../../src/__tests__/data/AppMenu.tsx'); // it's running in ./temp
        const result = parse(fileName);

        console.log(JSON.stringify(result, null, 4));
    });
});