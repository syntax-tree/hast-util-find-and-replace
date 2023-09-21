/**
 * @typedef {import('hast').Nodes} Nodes
 * @typedef {import('hast').Parents} Parents
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').RootContent} RootContent
 * @typedef {import('hast').Text} Text
 * @typedef {import('hast-util-is-element').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 */

/**
 * @typedef {RegExp | string} Find
 *   Pattern to find.
 *
 *   Strings are escaped and then turned into global expressions.
 *
 * @typedef {Array<FindAndReplaceTuple>} FindAndReplaceList
 *   Several find and replaces, in array form.
 *
 * @typedef {[Find, Replace?]} FindAndReplaceTuple
 *   Find and replace in tuple form.
 *
 * @typedef RegExpMatchObject
 *   Info on the match.
 * @property {number} index
 *   The index of the search at which the result was found.
 * @property {string} input
 *   A copy of the search string in the text node.
 * @property {[...Array<Parents>, Text]} stack
 *   All ancestors of the text node, where the last node is the text itself.
 *
 * @typedef {ReplaceFunction | string | null | undefined} Replace
 *   Thing to replace with.
 *
 * @callback ReplaceFunction
 *   Callback called when a search matches.
 * @param {...any} parameters
 *   The parameters are the result of corresponding search expression:
 *
 *   * `value` (`string`) — whole match
 *   * `...capture` (`Array<string>`) — matches from regex capture groups
 *   * `match` (`RegExpMatchObject`) — info on the match
 * @returns {Array<RootContent> | RootContent | string | false | null | undefined}
 *   Thing to replace with.
 *
 *   * when `null`, `undefined`, `''`, remove the match
 *   * …or when `false`, do not replace at all
 *   * …or when `string`, replace with a text node of that value
 *   * …or when `Node` or `Array<Node>`, replace with those nodes
 *
 * @typedef {[RegExp, ReplaceFunction]} Pair
 *   Normalized find and replace.
 * @typedef {Array<Pair>} Pairs
 *   All find and replaced.
 *
 * @typedef Options
 *   Configuration.
 * @property {Test | null | undefined} [ignore]
 *   Test for which elements to ignore (optional).
 */

import {visitParents} from 'unist-util-visit-parents'
import {convertElement} from 'hast-util-is-element'
import escape from 'escape-string-regexp'

/** @type {Options} */
const emptyOptions = {}

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
 * @param {Nodes} tree
 *   Tree to change.
 * @param {FindAndReplaceList | FindAndReplaceTuple} list
 *   One or more find-and-replace pairs.
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (when `find` is not `Find`).
 * @returns {undefined}
 *   Nothing.
 */
export function findAndReplace(tree, list, options) {
  const settings = options || emptyOptions
  const ignored = convertElement(settings.ignore || defaultIgnore)
  const pairs = toPairs(list)
  let pairIndex = -1

  while (++pairIndex < pairs.length) {
    visitParents(tree, 'text', visitor)
  }

  /** @type {import('unist-util-visit-parents').BuildVisitor<Root, 'text'>} */
  function visitor(node, parents) {
    let index = -1
    /** @type {Parents | undefined} */
    let grandparent

    while (++index < parents.length) {
      const parent = parents[index]
      /** @type {Array<Nodes> | undefined} */
      const siblings = grandparent ? grandparent.children : undefined

      if (
        ignored(
          parent,
          siblings ? siblings.indexOf(parent) : undefined,
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
   * @param {Array<Parents>} parents
   *   Parents.
   * @returns {VisitorResult}
   *   Result.
   */
  function handler(node, parents) {
    const parent = parents[parents.length - 1]
    const find = pairs[pairIndex][0]
    const replace = pairs[pairIndex][1]
    let start = 0
    /** @type {Array<Nodes>} */
    const siblings = parent.children
    const index = siblings.indexOf(node)
    let change = false
    /** @type {Array<RootContent>} */
    let nodes = []

    find.lastIndex = 0

    let match = find.exec(node.value)

    while (match) {
      const position = match.index
      /** @type {RegExpMatchObject} */
      const matchObject = {
        index: match.index,
        input: match.input,
        stack: [...parents, node]
      }
      let value = replace(...match, matchObject)

      if (typeof value === 'string') {
        value = value.length > 0 ? {type: 'text', value} : undefined
      }

      // It wasn’t a match after all.
      if (value === false) {
        // False acts as if there was no match.
        // So we need to reset `lastIndex`, which currently being at the end of
        // the current match, to the beginning.
        find.lastIndex = position + 1
      } else {
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
 * Turn a tuple or a list of tuples into pairs.
 *
 * @param {FindAndReplaceList | FindAndReplaceTuple} tupleOrList
 *   Schema.
 * @returns {Pairs}
 *   Clean pairs.
 */
function toPairs(tupleOrList) {
  /** @type {Pairs} */
  const result = []

  if (!Array.isArray(tupleOrList)) {
    throw new TypeError('Expected find and replace tuple or list of tuples')
  }

  /** @type {FindAndReplaceList} */
  // @ts-expect-error: correct.
  const list =
    !tupleOrList[0] || Array.isArray(tupleOrList[0])
      ? tupleOrList
      : [tupleOrList]

  let index = -1

  while (++index < list.length) {
    const tuple = list[index]
    result.push([toExpression(tuple[0]), toFunction(tuple[1])])
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
  return typeof replace === 'function'
    ? replace
    : function () {
        return replace
      }
}
