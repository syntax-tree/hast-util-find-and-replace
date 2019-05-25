# hast-util-find-and-replace

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[**hast**][hast] utility to find and replace text in a [*tree*][tree].

## Install

[npm][]:

```sh
npm install hast-util-find-and-replace
```

## Usage

```js
var h = require('hastscript')
var inspect = require('unist-util-inspect')
var findAndReplace = require('hast-util-find-and-replace')

var tree = h('p', [
  'Some ',
  h('em', 'emphasis'),
  ', ',
  h('strong', 'importance'),
  ', and ',
  h('code', 'code'),
  '.'
])

findAndReplace(tree, 'and', 'or')

findAndReplace(tree, {emphasis: 'em', importance: 'strong'})

findAndReplace(tree, {
  code: function($0) {
    return h('a', {href: '//example.com#' + $0}, $0)
  }
})

console.log(inspect(tree))
```

Yields:

```text
element[9] [tagName="p"]
├─ text: "Some "
├─ element[1] [tagName="em"]
│  └─ text: "em"
├─ text: ", "
├─ element[1] [tagName="strong"]
│  └─ text: "strong"
├─ text: ", "
├─ text: "or"
├─ text: " "
├─ element[1] [tagName="code"]
│  └─ element[1] [tagName="a"][properties={"href":"//example.com#code"}]
│     └─ text: "code"
└─ text: "."
```

## API

### `findAndReplace(tree, find[, replace][, options])`

Find and replace text in a [**hast**][hast] [*tree*][tree].
The algorithm searches the tree in [*preorder*][preorder] for complete values
in [`Text`][text] nodes.
Partial matches are not supported.

###### Signatures

*   `findAndReplace(tree, find, replace[, options])`
*   `findAndReplace(tree, search[, options])`

###### Parameters

*   `tree` ([`Node`][node])
    — [**hast**][hast] [*tree*][tree]
*   `find` (`string` or `RegExp`)
    — Value to find and remove.
    When `string`, escaped and made into a global `RegExp`
*   `replace` (`string` or `Function`)
    — Value to insert.
    When `string`, turned into a [`Text`][text] node.
    When `Function`, invoked with the results of calling `RegExp.exec` as
    arguments, in which case it can return a [`Node`][node] or a `string`, which
    is in the latter case wrapped in a [`Text`][text] node
*   `search` (`Object` or `Array`)
    — Perform multiple find-and-replace’s.
    When `Array`, each entry is a tuple (`Array`) of a `find` (at `0`) and
    `replace` (at `1`).
    When `Object`, each key is a `find` (in string form) and each value is a
    `replace`
*   `options.ignore` (`Array`, default: `['title', 'script', 'style', 'svg',
    'math']`)
    — Tag-names of elements *not* to search.
    This list can be accessed at `findAndReplace.ignore`

###### Returns

The given, modified, `tree`.

## Contribute

See [`contributing.md` in `syntax-tree/.github`][contributing] for ways to get
started.
See [`support.md`][support] for ways to get help.

This project has a [Code of Conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://img.shields.io/travis/syntax-tree/hast-util-find-and-replace.svg

[build]: https://travis-ci.org/syntax-tree/hast-util-find-and-replace

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-find-and-replace.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-find-and-replace

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-find-and-replace.svg

[downloads]: https://www.npmjs.com/package/hast-util-find-and-replace

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-util-find-and-replace.svg

[size]: https://bundlephobia.com/result?p=hast-util-find-and-replace

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/join%20the%20community-on%20spectrum-7b16ff.svg

[chat]: https://spectrum.chat/unified/syntax-tree

[npm]: https://docs.npmjs.com/cli/install

[license]: license

[author]: https://wooorm.com

[contributing]: https://github.com/syntax-tree/.github/blob/master/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/master/support.md

[coc]: https://github.com/syntax-tree/.github/blob/master/code-of-conduct.md

[hast]: https://github.com/syntax-tree/hast

[node]: https://github.com/syntax-tree/hast#ndoes

[tree]: https://github.com/syntax-tree/unist#tree

[preorder]: https://github.com/syntax-tree/unist#preorder

[text]: https://github.com/syntax-tree/hast#text
