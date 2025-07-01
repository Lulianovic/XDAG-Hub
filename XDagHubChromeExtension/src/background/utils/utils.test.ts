

import { describe, expect, it } from 'vitest';
import { base64Decode, base64DecodeJson, base64Encode, base64EncodeJson } from '.';
import exp from 'constants';

const inscriptionTest =
{
    imgStr: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAHAwGNRRkVAAAAABJRU5Erw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAHAwGNRRkVAAAAABJRU5Erw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAHAwGNRRkVAAAAABJRU5Erw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAHAwGNRRkVAAAAABJRU5Erw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAHAwGNRRkVAAAAABJRU5ErAAADUlEQVR42mNkYPhfDwAHAwGNRRkVAAAAABJRU5ErkJggg==",
    id: "sdfadf",
    text: "yesa, 我今天中午休息,goo,好",
}

describe('testBase46EncodeDecode', () => {
    it('base 64 encode decode:', () => {
        const jsonString = JSON.stringify(inscriptionTest);
        const b46String = base64Encode(jsonString);
        const backString = base64Decode(b46String);
        const obj1 = JSON.parse(backString);

        expect(obj1).toBeDefined();
        if (obj1) {
            expect(obj1?.text).toBe(inscriptionTest.text);
        }


        const b46Str = base64EncodeJson(inscriptionTest);
        const backObj = base64DecodeJson(b46Str) as any;
        expect(backObj).toBeDefined();
        if (backObj) {
            expect(backObj.text === inscriptionTest.text);
            expect(backObj.imgStr === inscriptionTest.imgStr);
        }
    });
});
