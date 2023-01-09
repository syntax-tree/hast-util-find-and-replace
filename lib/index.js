/**
 * @typedef {import('hast').Text} Text
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Content} Content
 * @typedef {import('hast-util-is-element').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 */

/**
 * @typedef {Root | Content} Node
 *
 * @typedef RegExpMatchObject
 *   Info on the match.
 * @property {number} index
 *   The index of the search at which the result was found.
 * @property {string} input
 *   A copy of the search string in the text node.
 * @property {[Root, ...Array<Element>, Text]} stack
 *   All ancestors of the text node, where the last node is the text itself.
 *
 * @callback ReplaceFunction
 *   Callback called when a search matches.
 * @param {...any} parameters
 *   The parameters are the result of corresponding search expression:
 *
 *   * `value` (`string`) — whole match
 *   * `...capture` (`Array<string>`) — matches from regex capture groups
 *   * `match` (`RegExpMatchObject`) — info on the match
 * @returns {Array<Content> | Content | string | false | undefined | null}
 *   Thing to replace with.
 *
 *   * when `null`, `undefined`, `''`, remove the match
 *   * …or when `false`, do not replace at all
 *   * …or when `string`, replace with a text node of that value
 *   * …or when `Node` or `Array<Node>`, replace with those nodes
 *
 * @typedef {string | RegExp} Find
 *   Pattern to find.
 *
 *   Strings are escaped and then turned into global expressions.
 *
 * @typedef {Array<FindAndReplaceTuple>} FindAndReplaceList
 *   Several find and replaces, in array form.
 * @typedef {Record<string, Replace>} FindAndReplaceSchema
 *   Several find and replaces, in object form.
 * @typedef {[Find, Replace]} FindAndReplaceTuple
 *   Find and replace in tuple form.
 * @typedef {string | ReplaceFunction} Replace
 *   Thing to replace with.
 * @typedef {[RegExp, ReplaceFunction]} Pair
 *   Normalized find and replace.
 * @typedef {Array<Pair>} Pairs
 *   All find and replaced.
 *
 * @typedef Options
 *   Configuration.
 * @property {Test | null | undefined} [ignore]
 *   Test for which elements to ignore.
 */

import {visitParents} from 'unist-util-visit-parents'
import {convertElement} from 'hast-util-is-element'
import escape from 'escape-string-regexp'

const own = {}.hasOwnProperty

/**
 * Default tag names to ignore.
 *
 * The defaults are `math`, `script`, `style`, `svg`, and `title`.
 *
 * @type {Array<string>}
 */
export const defaultIgnore = ['math', 'script', 'style', 'svg', 'title']

/**
 * Find patterns in a tree and replace them.
 *
 * The algorithm searches the tree in *preorder* for complete values in `Text`
 * nodes.
 * Partial matches are not supported.
 *
 * @template {Node} Tree
 *   Node type.
 * @param {Tree} tree
 *   Tree to change.
 * @param {Find | FindAndReplaceSchema | FindAndReplaceList} find
 *   Patterns to find.
 * @param {Replace | Options | null | undefined} [replace]
 *   Things to replace with (when `find` is `Find`) or configuration.
 * @param {Options | null | undefined} [options]
 *   Configuration (when `find` is not `Find`).
 * @returns {Tree}
 *   Given, modified, tree.
 */
export function findAndReplace(tree, find, replace, options) {
  /** @type {Options | null | undefined} */
  let settings
  /** @type {FindAndReplaceSchema | FindAndReplaceList} */
  let schema

  if (typeof find === 'string' || find instanceof RegExp) {
    // @ts-expect-error don’t expect options twice.
    schema = [[find, replace]]
    settings = options
  } else {
    schema = find
    // @ts-expect-error don’t expect replace twice.
    settings = replace
  }

  if (!settings) {
    settings = {}
  }

  const ignored = convertElement(settings.ignore || defaultIgnore)
  const pairs = toPairs(schema)
  let pairIndex = -1

  while (++pairIndex < pairs.length) {
    visitParents(tree, 'text', visitor)
  }

  // To do next major: don’t return the given tree.
  return tree

  /** @type {import('unist-util-visit-parents/complex-types.js').BuildVisitor<Node, 'text'>} */
  function visitor(node, parents) {
    let index = -1
    /** @type {Root | Element | undefined} */
    let grandparent

    while (++index < parents.length) {
      const parent = parents[index]

      if (
        ignored(
          parent,
          // @ts-expect-error: TS doesn’t understand but it’s perfect.
          grandparent ? grandparent.children.indexOf(parent) : undefined,
          grandparent
        )
      ) {
        return
      }

      grandparent = parent
    }

    if (grandparent) {
      return handler(node, parents)
    }
  }

  /**
   * Handle a text node which is not in an ignored parent.
   *
   * @param {Text} node
   *   Text node.
   * @param {Array<Root | Element>} parents
   *   Parents.
   * @returns {VisitorResult}
   *   Result.
   */
  function handler(node, parents) {
    const parent = parents[parents.length - 1]
    const find = pairs[pairIndex][0]
    const replace = pairs[pairIndex][1]
    let start = 0
    const index = parent.children.indexOf(node)
    let change = false
    /** @type {Array<Content>} */
    let nodes = []

    find.lastIndex = 0

    let match = find.exec(node.value)

    while (match) {
      const position = match.index
      /** @type {RegExpMatchObject} */
      const matchObject = {
        index: match.index,
        input: match.input,
        // @ts-expect-error: stack is fine.
        stack: [...parents, node]
      }
      let value = replace(...match, matchObject)

      if (typeof value === 'string') {
        value = value.length > 0 ? {type: 'text', value} : undefined
      }

      // It wasn’t a match after all.
      if (value !== false) {
        if (start !== position) {
          nodes.push({type: 'text', value: node.value.slice(start, position)})
        }

        if (Array.isArray(value)) {
          nodes.push(...value)
        } else if (value) {
          nodes.push(value)
        }

        start = position + match[0].length
        change = true
      }

      if (!find.global) {
        break
      }

      match = find.exec(node.value)
    }

    if (change) {
      if (start < node.value.length) {
        nodes.push({type: 'text', value: node.value.slice(start)})
      }

      parent.children.splice(index, 1, ...nodes)
    } else {
      nodes = [node]
    }

    return index + nodes.length
  }
}

/**
 * Turn a schema into pairs.
 *
 * @param {FindAndReplaceSchema | FindAndReplaceList} schema
 *   Schema.
 * @returns {Pairs}
 *   Clean pairs.
 */
function toPairs(schema) {
  /** @type {Pairs} */
  const result = []

  if (typeof schema !== 'object') {
    throw new TypeError('Expected array or object as schema')
  }

  if (Array.isArray(schema)) {
    let index = -1

    while (++index < schema.length) {
      result.push([
        toExpression(schema[index][0]),
        toFunction(schema[index][1])
      ])
    }
  } else {
    /** @type {string} */
    let key

    for (key in schema) {
      if (own.call(schema, key)) {
        result.push([toExpression(key), toFunction(schema[key])])
      }
    }
  }

  return result
}

/**
 * Turn a find into an expression.
 *
 * @param {Find} find
 *   Find.
 * @returns {RegExp}
 *   Expression.
 */
function toExpression(find) {
  return typeof find === 'string' ? new RegExp(escape(find), 'g') : find
}

/**
 * Turn a replace into a function.
 *
 * @param {Replace} replace
 *   Replace.
 * @returns {ReplaceFunction}
 *   Function.
 */
function toFunction(replace) {
  return typeof replace === 'function' ? replace : () => replace
}
