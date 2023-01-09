# hast-util-find-and-replace

[![Build][build-badge]][build]
[![Coverage][coverage-badge]][coverage]
[![Downloads][downloads-badge]][downloads]
[![Size][size-badge]][size]
[![Sponsors][sponsors-badge]][collective]
[![Backers][backers-badge]][collective]
[![Chat][chat-badge]][chat]

[hast][] utility to find and replace things.

## Contents

*   [What is this?](#what-is-this)
*   [When should I use this?](#when-should-i-use-this)
*   [Install](#install)
*   [Use](#use)
*   [API](#api)
    *   [`findAndReplace(tree, find, replace[, options])`](#findandreplacetree-find-replace-options)
    *   [`defaultIgnore`](#defaultignore)
    *   [`Find`](#find)
    *   [`FindAndReplaceList`](#findandreplacelist)
    *   [`FindAndReplaceSchema`](#findandreplaceschema)
    *   [`FindAndReplaceTuple`](#findandreplacetuple)
    *   [`Options`](#options)
    *   [`RegExpMatchObject`](#regexpmatchobject)
    *   [`Replace`](#replace)
    *   [`ReplaceFunction`](#replacefunction)
*   [Types](#types)
*   [Compatibility](#compatibility)
*   [Security](#security)
*   [Related](#related)
*   [Contribute](#contribute)
*   [License](#license)

## What is this?

This package is a utility that lets you find patterns (`string`, `RegExp`) in
text and replace them with nodes (such as elements).
It’s aware of HTML (such as ignoring `<style>` and `<script>` by default).

## When should I use this?

This utility is typically useful when you have regexes and want to modify hast.
One example is when you have some form of “mentions” (such as
`/@([a-z][_a-z0-9])\b/gi`) and want to create links to persons from them.

## Install

This package is [ESM only][esm].
In Node.js (version 14.14+ and or 16.0+), install with [npm][]:

```sh
npm install hast-util-find-and-replace
```

In Deno with [`esm.sh`][esmsh]:

```js
import {findAndReplace} from 'https://esm.sh/hast-util-find-and-replace@4'
```

In browsers with [`esm.sh`][esmsh]:

```html
<script type="module">
  import {findAndReplace} from 'https://esm.sh/hast-util-find-and-replace@4?bundle'
</script>
```

## Use

```js
import {h} from 'hastscript'
import {findAndReplace} from 'hast-util-find-and-replace'
import {inspect} from 'unist-util-inspect'

const tree = h('p', [
  'Some ',
  h('em', 'emphasis'),
  ', ',
  h('strong', 'importance'),
  ', and ',
  h('code', 'code'),
  '.'
])

findAndReplace(tree, [
  [/and/gi, 'or'],
  [/emphasis/gi, 'em'],
  [/importance/gi, 'strong'],
  [
    /code/gi,
    function ($0) {
      return h('a', {href: '//example.com#' + $0}, $0)
    }
  ]
])

console.log(inspect(tree))
```

Yields:

```txt
element<p>[9]
│ properties: {}
├─0 text "Some "
├─1 element<em>[1]
│   │ properties: {}
│   └─0 text "em"
├─2 text ", "
├─3 element<strong>[1]
│   │ properties: {}
│   └─0 text "strong"
├─4 text ", "
├─5 text "or"
├─6 text " "
├─7 element<code>[1]
│   │ properties: {}
│   └─0 element<a>[1]
│       │ properties: {"href":"//example.com#code"}
│       └─0 text "code"
└─8 text "."
```

## API

This package exports the identifiers [`defaultIgnore`][defaultignore] and
[`findAndReplace`][findandreplace].
There is no default export.

### `findAndReplace(tree, find, replace[, options])`

Find patterns in a tree and replace them.

The algorithm searches the tree in *[preorder][]* for complete values in
[`Text`][text] nodes.
Partial matches are not supported.

###### Signatures

*   `findAndReplace(tree, find, replace[, options])`
*   `findAndReplace(tree, search[, options])`

###### Parameters

*   `tree` ([`Node`][node])
    — tree to change
*   `find` ([`Find`][find])
    — value to find and remove
*   `replace` ([`Replace`][replace])
    — thing to replace with
*   `search` ([`FindAndReplaceSchema`][findandreplaceschema] or
    [`FindAndReplaceList`][findandreplacelist])
    — several find and replaces
*   `options` ([`Options`][options])
    — configuration

###### Returns

Given, modified, tree ([`Node`][node]).

### `defaultIgnore`

Default tag names to ignore.

The defaults are `math`, `script`, `style`, `svg`, and `title`.

###### Type

```ts
type defaultIgnore = Array<string>
```

### `Find`

Pattern to find (TypeScript type).

Strings are escaped and then turned into global expressions.

###### Type

```ts
type Find = string | RegExp
```

### `FindAndReplaceList`

Several find and replaces, in array form (TypeScript type).

###### Type

```ts
type FindAndReplaceList = Array<FindAndReplaceTuple>
```

See [`FindAndReplaceTuple`][findandreplacetuple].

### `FindAndReplaceSchema`

Several find and replaces, in object form (TypeScript type).

###### Type

```ts
type FindAndReplaceSchema = Record<string, Replace>
```

See [`Replace`][replace].

### `FindAndReplaceTuple`

Find and replace in tuple form (TypeScript type).

###### Type

```ts
type FindAndReplaceTuple = [Find, Replace]
```

See [`Find`][find] and [`Replace`][replace].

### `Options`

Configuration (TypeScript type).

###### Fields

*   `ignore` ([`Test`][test], optional)
    — test for which elements to ignore

### `RegExpMatchObject`

Info on the match (TypeScript type).

###### Fields

*   `index` (`number`)
    — the index of the search at which the result was found
*   `input` (`string`)
    — a copy of the search string in the text node
*   `stack` ([`Array<Node>`][node])
    — all ancestors of the text node, where the last node is the text itself

### `Replace`

Thing to replace with (TypeScript type).

###### Type

```ts
type Replace = string | ReplaceFunction
```

See [`ReplaceFunction`][replacefunction].

### `ReplaceFunction`

Callback called when a search matches (TypeScript type).

###### Parameters

The parameters are the result of corresponding search expression:

*   `value` (`string`)
    — whole match
*   `...capture` (`Array<string>`)
    — matches from regex capture groups
*   `match` ([`RegExpMatchObject`][regexpmatchobject])
    — info on the match

###### Returns

Thing to replace with:

*   when `null`, `undefined`, `''`, remove the match
*   …or when `false`, do not replace at all
*   …or when `string`, replace with a text node of that value
*   …or when `Node` or `Array<Node>`, replace with those nodes

## Types

This package is fully typed with [TypeScript][].
It exports the additional types [`Find`][find],
[`FindAndReplaceList`][findandreplacelist],
[`FindAndReplaceSchema`][findandreplaceschema],
[`FindAndReplaceTuple`][findandreplacetuple],
[`Options`][options],
[`RegExpMatchObject`][regexpmatchobject],
[`Replace`][replace], and
[`ReplaceFunction`][replacefunction].

## Compatibility

Projects maintained by the unified collective are compatible with all maintained
versions of Node.js.
As of now, that is Node.js 14.14+ and 16.0+.
Our projects sometimes work with older versions, but this is not guaranteed.

## Security

Use of `hast-util-find-and-replace` can open you up to a
[cross-site scripting (XSS)][xss] attack if a value used to `replace` is unsafe.
Use [`hast-util-santize`][hast-util-sanitize] to make the hast tree safe.

The following example shows how a script is injected that runs when loaded in a
browser.

```js
const tree = h('p', 'This and that.')

findAndReplace(tree, 'and', () => h('script', 'alert(1)'))
```

Yields:

```html
<p>This <script>alert(1)</script> that.</p>
```

## Related

*   [`hast-util-select`](https://github.com/syntax-tree/hast-util-select)
    — `querySelector`, `querySelectorAll`, and `matches`
*   [`mdast-util-find-and-replace`](https://github.com/syntax-tree/mdast-util-find-and-replace)
    — find and replace in mdast
*   [`unist-util-select`](https://github.com/syntax-tree/unist-util-select)
    — select unist nodes with CSS-like selectors

## Contribute

See [`contributing.md`][contributing] in [`syntax-tree/.github`][health] for
ways to get started.
See [`support.md`][support] for ways to get help.

This project has a [code of conduct][coc].
By interacting with this repository, organisation, or community you agree to
abide by its terms.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://github.com/syntax-tree/hast-util-find-and-replace/workflows/main/badge.svg

[build]: https://github.com/syntax-tree/hast-util-find-and-replace/actions

[coverage-badge]: https://img.shields.io/codecov/c/github/syntax-tree/hast-util-find-and-replace.svg

[coverage]: https://codecov.io/github/syntax-tree/hast-util-find-and-replace

[downloads-badge]: https://img.shields.io/npm/dm/hast-util-find-and-replace.svg

[downloads]: https://www.npmjs.com/package/hast-util-find-and-replace

[size-badge]: https://img.shields.io/bundlephobia/minzip/hast-util-find-and-replace.svg

[size]: https://bundlephobia.com/result?p=hast-util-find-and-replace

[sponsors-badge]: https://opencollective.com/unified/sponsors/badge.svg

[backers-badge]: https://opencollective.com/unified/backers/badge.svg

[collective]: https://opencollective.com/unified

[chat-badge]: https://img.shields.io/badge/chat-discussions-success.svg

[chat]: https://github.com/syntax-tree/unist/discussions

[npm]: https://docs.npmjs.com/cli/install

[esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[esmsh]: https://esm.sh

[typescript]: https://www.typescriptlang.org

[license]: license

[author]: https://wooorm.com

[health]: https://github.com/syntax-tree/.github

[contributing]: https://github.com/syntax-tree/.github/blob/main/contributing.md

[support]: https://github.com/syntax-tree/.github/blob/main/support.md

[coc]: https://github.com/syntax-tree/.github/blob/main/code-of-conduct.md

[hast]: https://github.com/syntax-tree/hast

[node]: https://github.com/syntax-tree/hast#ndoes

[preorder]: https://github.com/syntax-tree/unist#preorder

[text]: https://github.com/syntax-tree/hast#text

[xss]: https://en.wikipedia.org/wiki/Cross-site_scripting

[hast-util-sanitize]: https://github.com/syntax-tree/hast-util-sanitize

[test]: https://github.com/syntax-tree/hast-util-is-element#test

[defaultignore]: #defaultignore

[findandreplace]: #findandreplacetree-find-replace-options

[options]: #options

[find]: #find

[replace]: #replace

[replacefunction]: #replacefunction

[findandreplacelist]: #findandreplacelist

[findandreplaceschema]: #findandreplaceschema

[findandreplacetuple]: #findandreplacetuple

[regexpmatchobject]: #regexpmatchobject
