'use strict'

var array = require('isarray')
var regexp = require('is-regex')
var visit = require('unist-util-visit-parents')
var is = require('hast-util-is-element')
var escape = require('escape-string-regexp')

var defaultIgnore = ['title', 'script', 'style', 'svg', 'math']

module.exports = findAndReplace

findAndReplace.ignore = defaultIgnore

function findAndReplace(tree, find, replace, options) {
  var settings
  var schema

  if (typeof find === 'string' || regexp(find)) {
    schema = [[find, replace]]
  } else {
    schema = find
    options = replace
  }

  settings = options || {}

  search(tree, settings, handlerFactory(toPairs(schema)))

  return tree

  function handlerFactory(pairs) {
    var pair = pairs[0]

    return handler

    function handler(node, parent) {
      var siblings = parent.children
      var pos = siblings.indexOf(node)
      var value = node.value
      var find = pair[0]
      var replace = pair[1]
      var lastIndex = 0
      var nodes = []
      var subvalue
      var index
      var length
      var match
      var subhandler

      find.lastIndex = 0

      match = find.exec(value)

      while (match) {
        index = match.index
        subvalue = value.slice(lastIndex, index)

        if (subvalue) {
          nodes.push({type: 'text', value: subvalue})
        }

        subvalue = replace.apply(null, match)

        if (subvalue) {
          if (typeof subvalue === 'string') {
            subvalue = {type: 'text', value: subvalue}
          }

          nodes.push(subvalue)
        }

        lastIndex = index + match[0].length

        if (!find.global) {
          break
        }

        match = find.exec(value)
      }

      if (index === undefined) {
        nodes = [node]
      } else {
        subvalue = value.slice(lastIndex)

        if (subvalue) {
          nodes.push({type: 'text', value: subvalue})
        }

        parent.children = siblings
          .slice(0, pos)
          .concat(nodes)
          .concat(siblings.slice(pos + 1))
      }

      if (pairs.length <= 1) {
        return
      }

      length = nodes.length
      index = -1
      subhandler = handlerFactory(pairs.slice(1))

      while (++index < length) {
        node = nodes[index]

        if (node.type === 'text') {
          subhandler(node, parent)
        } else {
          search(node, settings, subhandler)
        }
      }
    }
  }
}

function search(tree, options, handler) {
  var ignore = options.ignore || defaultIgnore
  var result = []

  visit(tree, 'text', visitor)

  return result

  function visitor(node, parents) {
    var length = parents.length
    var index = length

    while (index--) {
      if (is(parents[index], ignore)) {
        return
      }
    }

    handler(node, parents[length - 1])
  }
}

function toPairs(schema) {
  var result = []
  var key
  var length
  var index

  if (typeof schema !== 'object') {
    throw new Error('Expected array or object as schema')
  }

  if (array(schema)) {
    length = schema.length
    index = -1

    while (++index < length) {
      result.push([
        toExpression(schema[index][0]),
        toFunction(schema[index][1])
      ])
    }
  } else {
    for (key in schema) {
      result.push([toExpression(key), toFunction(schema[key])])
    }
  }

  return result
}

function toExpression(find) {
  return typeof find === 'string' ? new RegExp(escape(find), 'g') : find
}

function toFunction(replace) {
  return typeof replace === 'function' ? replace : returner

  function returner() {
    return replace
  }
}
