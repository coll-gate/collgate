/**
 * @file default.js
 * @brief Default unit test cases.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-03
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

import test from 'ava';

test('foo', t => {
    t.pass();
});

test('bar', async t => {
    const bar = Promise.resolve('bar');

    t.is(await bar, 'bar');
});

