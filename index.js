/**
 * @typedef Options
 * @property {Test} [ignore]
 *
 * @typedef {import('hast').Text} Text
 * @typedef {import('hast').Parent} Parent
 * @typedef {import('hast').Root} Root
 * @typedef {import('hast').Element['children'][number]} Content
 * @typedef {Parent['children'][number]|Root} Node
 *
 * @typedef {import('hast-util-is-element').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 *
 * @typedef RegExpMatchObject
 * @property {number} index
 * @property {string} input
 *
 * @typedef {string|RegExp} Find
 * @typedef {string|ReplaceFunction} Replace
 *
 * @typedef {[Find, Replace]} FindAndReplaceTuple
 * @typedef {Object.<string, Replace>} FindAndReplaceSchema
 * @typedef {Array.<FindAndReplaceTuple>} FindAndReplaceList
 *
 * @typedef {[RegExp, ReplaceFunction]} Pair
 * @typedef {Array.<Pair>} Pairs
 */

/**
 * @callback ReplaceFunction
 * @param {...unknown} parameters
 * @returns {Array.<Content>|Content|string|false|undefined|null}
 */

import {visitParents} from 'unist-util-visit-parents'
import {convertElement} from 'hast-util-is-element'
import escape from 'escape-string-regexp'

var own = {}.hasOwnProperty

export const defaultIgnore = ['title', 'script', 'style', 'svg', 'math']

/**
 * @param {Node} tree
 * @param {Find|FindAndReplaceSchema|FindAndReplaceList} find
 * @param {Replace|Options} [replace]
 * @param {Options} [options]
 */
export function findAndReplace(tree, find, replace, options) {
  /** @type {Options} */
  var settings
  /** @type {FindAndReplaceSchema|FindAndReplaceList} */
  var schema

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

  var ignored = convertElement(settings.ignore || defaultIgnore)
  var pairs = toPairs(schema)
  var pairIndex = -1

  while (++pairIndex < pairs.length) {
    visitParents(tree, 'text', visitor)
  }

  return tree

  /** @type {import('unist-util-visit-parents').Visitor<Text>} */
  function visitor(node, parents) {
    var index = -1
    /** @type {Parent} */
    var parent
    /** @type {Parent} */
    var grandparent

    while (++index < parents.length) {
      // @ts-expect-error hast vs. unist parent.
      parent = parents[index]

      if (
        ignored(
          parent,
          // @ts-expect-error hast vs. unist parent.
          grandparent ? grandparent.children.indexOf(parent) : undefined,
          grandparent
        )
      ) {
        return
      }

      grandparent = parent
    }

    return handler(node, grandparent)
  }

  /**
   * @param {Text} node
   * @param {Parent} parent
   * @returns {VisitorResult}
   */
  function handler(node, parent) {
    var find = pairs[pairIndex][0]
    var replace = pairs[pairIndex][1]
    /** @type {Array.<Content>} */
    var nodes = []
    var start = 0
    var index = parent.children.indexOf(node)
    /** @type {number} */
    var position
    /** @type {RegExpMatchArray} */
    var match
    /** @type {Array.<Content>|Content|string|false|undefined|null} */
    var value

    find.lastIndex = 0

    match = find.exec(node.value)

    while (match) {
      position = match.index
      // @ts-expect-error this is perfectly fine, typescript.
      value = replace(...match, {index: match.index, input: match.input})

      if (typeof value === 'string' && value.length > 0) {
        value = {type: 'text', value}
      }

      if (value !== false) {
        if (start !== position) {
          nodes.push({type: 'text', value: node.value.slice(start, position)})
        }

        if (value) {
          nodes = [].concat(nodes, value)
        }

        start = position + match[0].length
      }

      if (!find.global) {
        break
      }

      match = find.exec(node.value)
    }

    if (position === undefined) {
      nodes = [node]
      index--
    } else {
      if (start < node.value.length) {
        nodes.push({type: 'text', value: node.value.slice(start)})
      }

      parent.children.splice(index, 1, ...nodes)
    }

    return index + nodes.length + 1
  }
}

/**
 * @param {FindAndReplaceSchema|FindAndReplaceList} schema
 * @returns {Pairs}
 */
function toPairs(schema) {
  var index = -1
  /** @type {Pairs} */
  var result = []
  /** @type {string} */
  var key

  if (typeof schema !== 'object') {
    throw new TypeError('Expected array or object as schema')
  }

  if (Array.isArray(schema)) {
    while (++index < schema.length) {
      result.push([
        toExpression(schema[index][0]),
        toFunction(schema[index][1])
      ])
    }
  } else {
    for (key in schema) {
      if (own.call(schema, key)) {
        result.push([toExpression(key), toFunction(schema[key])])
      }
    }
  }

  return result
}

/**
 * @param {Find} find
 * @returns {RegExp}
 */
function toExpression(find) {
  return typeof find === 'string' ? new RegExp(escape(find), 'g') : find
}

/**
 * @param {Replace} replace
 * @returns {ReplaceFunction}
 */
function toFunction(replace) {
  return typeof replace === 'function' ? replace : returner

  /** @type {ReplaceFunction} */
  function returner() {
    // @ts-expect-error it’s a string.
    return replace
  }
}
