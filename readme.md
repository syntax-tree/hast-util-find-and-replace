# hast-util-find-and-replace [![Build Status][build-badge]][build-page] [![Coverage Status][coverage-badge]][coverage-page]

Find and replace text in a [HAST][] tree.

## Installation

[npm][]:

```bash
npm install hast-util-find-and-replace
```

## Usage

```javascript
var h = require('hastscript');
var inspect = require('unist-util-inspect');
var findAndReplace = require('hast-util-find-and-replace');

var tree = h('p', [
  'Some ',
  h('em', 'emphasis'),
  ', ',
  h('strong', 'importance'),
  ', and ',
  h('code', 'code'),
  '.'
]);

findAndReplace(tree, 'and', 'or');

findAndReplace(tree, {emphasis: 'em', importance: 'strong'});

findAndReplace(tree, {code: function ($0) {
  return h('a', {href: '//example.com#' + $0}, $0);
}});

console.log(inspect(tree));
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

Find and replace text in a [HAST][] tree.
The algorithm searches for complete values in text nodes.  Partial matches
are not supported.

###### Signatures

*   `findAndReplace(tree, find, replace[, options])`
*   `findAndReplace(tree, search[, options])`

###### Parameters

*   `tree` ([`Node`][node])
    — HAST tree.
*   `find` (`string` or `RegExp`)
    — Value to find and remove.  When `string`, escaped and made into a global
    `RegExp`.
*   `replace` (`string` or `Function`)
    — Value to insert.  When `string`, turned into a text node.  When
    `Function`, invoked with the results of calling `RegExp.exec` as arguments,
    in which case it can return a [`Node`][node] or a `string`, in which case
    it’s wrapped in a text node.
*   `search` (`Object` or `Array`)
    — Perform multiple find-and-replace’s.  When `Array`, each entry is a tuple
    (array) of a `find` and `replace`.  When `Object`, each key is a `find`
    (in string form) and each value is `replace`.
*   `options` (`Object`, optional):

    *   `ignore` (`Array`, default: `['title', 'script', 'style', 'svg',
        'math']`)
        — Tag-names of elements _not_ to search.

###### Returns

The given, modified, tree.

## Contribute

See [`contributing.md` in `syntax-tree/hast`][contributing] for ways to get
started.

This organisation has a [Code of Conduct][coc].  By interacting with this
repository, organisation, or community you agree to abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://img.shields.io/travis/syntax-tree/hast-util-find-and-replace.svg

[build-page]: https://travis-ci.org/syntax-tree/hast-util-find-and-replace

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-find-and-replace.svg

[coverage-page]: https://codecov.io/github/syntax-tree/hast-util-find-and-replace?branch=master

[npm]: https://docs.npmjs.com/cli/install

[license]: LICENSE

[author]: http://wooorm.com

[hast]: https://github.com/syntax-tree/hast

[node]: https://github.com/syntax-tree/hast#ast

[contributing]: https://github.com/syntax-tree/hast/blob/master/contributing.md

[coc]: https://github.com/syntax-tree/hast/blob/master/code-of-conduct.md
