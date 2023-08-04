import assert from 'node:assert/strict'
import test from 'node:test'
import {h} from 'hastscript'
import {findAndReplace} from 'hast-util-find-and-replace'

test('findAndReplace', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('hast-util-find-and-replace')).sort(),
      ['defaultIgnore', 'findAndReplace']
    )
  })

  await t.test(
    'should throw on invalid search and replaces',
    async function () {
      assert.throws(function () {
        const tree = create()
        // @ts-expect-error: check that the runtime throws an error.
        findAndReplace(tree, true)
      }, /Expected find and replace tuple or list of tuples/)
    }
  )

  await t.test('should remove without `replace`', async function () {
    const tree = create()

    findAndReplace(tree, ['emphasis'])

    assert.deepEqual(
      tree,
      h('p', [
        'Some ',
        h('em'),
        ', ',
        h('strong', 'importance'),
        ', and ',
        h('code', 'code'),
        '.'
      ])
    )
  })

  await t.test(
    'should work when given a find-and-replace tuple',
    async function () {
      const tree = create()

      findAndReplace(tree, ['emphasis', '!!!'])

      assert.deepEqual(
        tree,
        h('p', [
          'Some ',
          h('em', '!!!'),
          ', ',
          h('strong', 'importance'),
          ', and ',
          h('code', 'code'),
          '.'
        ])
      )
    }
  )

  await t.test(
    'should work when given `find` as a `RegExp` and `replace` as a `Function`',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        /em(\w+)is/,
        function (/** @type {string} */ _, /** @type {string} */ $1) {
          return '[' + $1 + ']'
        }
      ])

      assert.deepEqual(
        tree,
        h('p', [
          'Some ',
          h('em', '[phas]'),
          ', ',
          h('strong', 'importance'),
          ', and ',
          h('code', 'code'),
          '.'
        ])
      )
    }
  )

  await t.test(
    'should work when given `replace` returns an empty string',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return ''
        }
      ])

      assert.deepEqual(
        tree,
        h('p', [
          'Some ',
          h('em'),
          ', ',
          h('strong', 'importance'),
          ', and ',
          h('code', 'code'),
          '.'
        ])
      )
    }
  )

  await t.test(
    'should work when given `replace` returns a node',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return h('a', h('b', 'c'))
        }
      ])

      assert.deepEqual(
        tree,
        h('p', [
          'Some ',
          h('em', h('a', h('b', 'c'))),
          ', ',
          h('strong', 'importance'),
          ', and ',
          h('code', 'code'),
          '.'
        ])
      )
    }
  )

  await t.test(
    'should work when given `replace` returns a list of nodes',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        'emphasis',
        function () {
          return [h('a'), h('b', 'c')]
        }
      ])

      assert.deepEqual(
        tree,
        h('p', [
          'Some ',
          h('em', [h('a'), h('b', 'c')]),
          ', ',
          h('strong', 'importance'),
          ', and ',
          h('code', 'code'),
          '.'
        ])
      )
    }
  )

  await t.test('should work when given a list of tuples', async function () {
    const tree = create()

    findAndReplace(tree, [
      ['emphasis', '!!!'],
      ['importance', '???']
    ])

    assert.deepEqual(
      tree,
      h('p', [
        'Some ',
        h('em', '!!!'),
        ', ',
        h('strong', '???'),
        ', and ',
        h('code', 'code'),
        '.'
      ])
    )
  })

  await t.test(
    'should work when given an empty list of tuples',
    async function () {
      const tree = create()

      findAndReplace(tree, [])

      assert.deepEqual(tree, create())
    }
  )

  await t.test('should work on partial matches', async function () {
    const tree = create()

    findAndReplace(tree, [/\Bmp\B/, '[MP]'])

    assert.deepEqual(
      tree,
      h('p', [
        'Some ',
        h('em', ['e', '[MP]', 'hasis']),
        ', ',
        h('strong', ['i', '[MP]', 'ortance']),
        ', and ',
        h('code', 'code'),
        '.'
      ])
    )
  })

  await t.test('should find-and-replace recursively', async function () {
    const tree = create()

    findAndReplace(tree, [
      [
        'emphasis',
        function () {
          return h('a', 'importance')
        }
      ],
      ['importance', 'something else']
    ])

    assert.deepEqual(
      tree,
      h('p', [
        'Some ',
        h('em', h('a', 'something else')),
        ', ',
        h('strong', 'something else'),
        ', and ',
        h('code', 'code'),
        '.'
      ])
    )
  })

  await t.test('should ignore from options', async function () {
    const tree = h('p', [
      'Some ',
      h('em', 'importance'),
      ', ',
      h('strong', 'importance'),
      ', and ',
      h('code', 'importance'),
      '.'
    ])

    findAndReplace(tree, ['importance', '!!!'], {ignore: 'strong'})

    assert.deepEqual(
      tree,
      h('p', [
        'Some ',
        h('em', '!!!'),
        ', ',
        h('strong', 'importance'),
        ', and ',
        h('code', '!!!'),
        '.'
      ])
    )
  })

  await t.test('should not replace when returning `false`', async function () {
    const tree = create()

    findAndReplace(tree, [
      'emphasis',
      function () {
        return false
      }
    ])

    assert.deepEqual(tree, create())
  })

  await t.test('should not be order-sensitive with strings', async function () {
    const tree = h('p', 'Some emphasis, importance, and code.')

    findAndReplace(tree, [
      [
        'importance',
        function (/** @type {string} */ match) {
          return h('strong', match)
        }
      ],
      [
        'code',
        function (/** @type {string} */ match) {
          return h('code', match)
        }
      ],
      [
        'emphasis',
        function (/** @type {string} */ match) {
          return h('em', match)
        }
      ]
    ])

    assert.deepEqual(tree, create())
  })

  await t.test('should support a match, and then a `false`', async function () {
    const tree = h('p', 'aaa bbb')

    findAndReplace(tree, [
      [
        /\b\w+\b/g,
        function (/** @type {string} */ value) {
          return value === 'aaa' ? h('strong', value) : false
        }
      ]
    ])

    assert.deepEqual(tree, h('p', [h('strong', 'aaa'), ' bbb']))
  })

  await t.test('should not be order-sensitive with regexes', async function () {
    const tree = h('p', 'Some emphasis, importance, and code.')

    findAndReplace(tree, [
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
    ])

    assert.deepEqual(tree, create())
  })

  await t.test(
    'should support replacer as string (security, safe)',
    async function () {
      const tree = create()

      findAndReplace(tree, ['and', 'alert(1)'])

      assert.deepEqual(
        tree,
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
        ])
      )
    }
  )

  await t.test(
    'should support replacer as function (security, unsafe)',
    async function () {
      const tree = create()

      findAndReplace(tree, [
        'and',
        function () {
          return h('script', 'alert(1)')
        }
      ])

      assert.deepEqual(
        tree,
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
        ])
      )
    }
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
