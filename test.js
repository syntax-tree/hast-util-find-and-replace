import assert from 'node:assert/strict'
import test from 'node:test'
import {h} from 'hastscript'
import {findAndReplace} from './index.js'
import * as mod from './index.js'

test('findAndReplace', () => {
  assert.deepEqual(
    Object.keys(mod).sort(),
    ['defaultIgnore', 'findAndReplace'],
    'should expose the public api'
  )

  assert.throws(
    () => {
      // @ts-expect-error runtime.
      findAndReplace(create(), true)
    },
    /^TypeError: Expected array or object as schema$/,
    'should throw on invalid search and replaces'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis'),
    h('p', [
      'Some ',
      h('em'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should remove without `replace`'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', '!!!'),
    h('p', [
      'Some ',
      h('em', '!!!'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `find` and `replace`'
  )

  assert.deepEqual(
    findAndReplace(
      create(),
      /em(\w+)is/,
      (/** @type {string} */ _, /** @type {string} */ $1) => '[' + $1 + ']'
    ),
    h('p', [
      'Some ',
      h('em', '[phas]'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `find` as a `RegExp` and `replace` as a `Function`'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => ''),
    h('p', [
      'Some ',
      h('em'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `replace` returns an empty string'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => h('a', h('b', 'c'))),
    h('p', [
      'Some ',
      h('em', h('a', h('b', 'c'))),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `replace` returns a node'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => [h('a'), h('b', 'c')]),
    h('p', [
      'Some ',
      h('em', [h('a'), h('b', 'c')]),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `replace` returns a list of nodes'
  )

  assert.deepEqual(
    findAndReplace(create(), [
      ['emphasis', '!!!'],
      ['importance', '???']
    ]),
    h('p', [
      'Some ',
      h('em', '!!!'),
      ', ',
      h('strong', '???'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work when given `search` as an matrix of strings'
  )

  assert.deepEqual(
    findAndReplace(create(), {code: 'hacks', ',': '!'}),
    h('p', [
      'Some ',
      h('em', 'emphasis'),
      '!',
      ' ',
      h('strong', 'importance'),
      '!',
      ' and ',
      h('code', 'hacks'),
      '.'
    ]),
    'should work when given `search` as an object of strings'
  )

  assert.deepEqual(
    findAndReplace(create(), /\Bmp\B/, '[MP]'),
    h('p', [
      'Some ',
      h('em', ['e', '[MP]', 'hasis']),
      ', ',
      h('strong', ['i', '[MP]', 'ortance']),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should work on partial matches'
  )

  assert.deepEqual(
    findAndReplace(create(), {
      emphasis() {
        return h('a', 'importance')
      },
      importance: 'something else'
    }),
    h('p', [
      'Some ',
      h('em', h('a', 'something else')),
      ', ',
      h('strong', 'something else'),
      ', and ',
      h('code', 'code'),
      '.'
    ]),
    'should find-and-replace recursively'
  )

  assert.deepEqual(
    findAndReplace(
      h('p', [
        'Some ',
        h('em', 'importance'),
        ', ',
        h('strong', 'importance'),
        ', and ',
        h('code', 'importance'),
        '.'
      ]),
      'importance',
      '!!!',
      {ignore: 'strong'}
    ),
    h('p', [
      'Some ',
      h('em', '!!!'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', '!!!'),
      '.'
    ]),
    'should ignore from options'
  )

  assert.deepEqual(
    findAndReplace(create(), 'emphasis', () => false),
    create(),
    'should not replace when returning `false`'
  )

  assert.deepEqual(
    findAndReplace(h('p', 'Some emphasis, importance, and code.'), {
      importance(/** @type {string} */ match) {
        return h('strong', match)
      },
      code(/** @type {string} */ match) {
        return h('code', match)
      },
      emphasis(/** @type {string} */ match) {
        return h('em', match)
      }
    }),
    create(),
    'should not be order-sensitive with strings'
  )

  assert.deepEqual(
    findAndReplace(h('p', 'aaa bbb'), [
      [
        /\b\w+\b/g,
        function (/** @type {string} */ value) {
          return value === 'aaa' ? h('strong', value) : false
        }
      ]
    ]),
    h('p', [h('strong', 'aaa'), ' bbb']),
    'should support a match, and then a `false`'
  )
  assert.deepEqual(
    findAndReplace(h('p', 'Some emphasis, importance, and code.'), [
      [
        /importance/g,
        function (/** @type {string} */ match) {
          return h('strong', match)
        }
      ],
      [
        /code/g,
        function (/** @type {string} */ match) {
          return h('code', match)
        }
      ],
      [
        /emphasis/g,
        function (/** @type {string} */ match) {
          return h('em', match)
        }
      ]
    ]),
    create(),
    'should not be order-sensitive with regexes'
  )

  assert.deepEqual(
    findAndReplace(create(), 'and', 'alert(1)'),
    h('p', [
      'Some ',
      h('em', 'emphasis'),
      ', ',
      h('strong', 'importance'),
      ', ',
      'alert(1)',
      ' ',
      h('code', 'code'),
      '.'
    ]),
    'security: replacer as string (safe)'
  )

  assert.deepEqual(
    findAndReplace(create(), 'and', () => h('script', 'alert(1)')),
    h('p', [
      'Some ',
      h('em', 'emphasis'),
      ', ',
      h('strong', 'importance'),
      ', ',
      h('script', 'alert(1)'),
      ' ',
      h('code', 'code'),
      '.'
    ]),
    'security: replacer as function (unsafe)'
  )
})

function create() {
  return h('p', [
    'Some ',
    h('em', 'emphasis'),
    ', ',
    h('strong', 'importance'),
    ', and ',
    h('code', 'code'),
    '.'
  ])
}
