/*
 * 处理 taro import
 * 1. 处理 import 导入，比如 import { useState } from '@tarojs/taro' ==> import { useState } from REACT_TOKEN
 * 2. 处理使用的地方，比如 Taro.FC ==> React.FC
 * 3. 处理类组件的继承 class AdWebView extends Taro.Component
 * @Date: 2022-10-23 12:58:05
 * @Last Modified time: 2022-10-23 22:42:10
 */
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const {
  TARO_SPACE,
  TARO_TOKEN,
  REACT_TOKEN,
  REACT_SPACE
} = require('./constant')

const REACT_IMPORTS = [
  'useEffect',
  'useState',
  'useReducer',
  'useRef',
  'useLayoutEffect',
  'useImperativeHandle',
  'useCallback',
  'useMemo',
  'useContext',

  'FunctionComponent',
  'FC',
  'SFC',

  'Component',
  'PureComponent',
  'createRef',
  'createContext'
]

const transform = ast => {
  const reactSpecifiers = []
  let taroPath // taro 的引用语句
  let reactPath // 是否已经存在了 react 引用语句
  let isUseReactSpace // 是否使用了 react 的命名空间
  traverse(ast, {
    // 处理导入语句，比如 import { useState } from '@tarojs/taro'
    ImportDeclaration(path) {
      if (path.node.source.value === TARO_TOKEN) {
        if (!taroPath) {
          taroPath = path // 只用记录第一次的位置
        }
        // 处理 Taro Imports，比如 useMemo、useState 都需要从 react 引入
        const specifiers = []
        path.node.specifiers.forEach(specifier => {
          if (!REACT_IMPORTS.includes(specifier.local.name)) {
            // 从 taro 引入的 api 删除掉，变更为从 react 引入
            specifiers.push(specifier)
          } else {
            reactSpecifiers.push(specifier) // 塞入 react 备用
          }
        })
        path.node.specifiers = specifiers
      }
      if (path.node.source.value === REACT_TOKEN) {
        reactPath = path
      }
    },
    // typescript 类型生命，比如 const miniGuide: Taro.FC
    TSQualifiedName(path) {
      if (
        t.isIdentifier(path.node.right) &&
        t.isIdentifier(path.node.left) &&
        path.node.left.name === TARO_SPACE
      ) {
        // 检测 Taro 引入的 节点，比如: const miniGuide: Taro.FC
        if (REACT_IMPORTS.includes(path.node.right.name)) {
          // 满足从 react 引入的条件，直接更改 token 为 react 的命名空间
          // 因为这里使用了 react 的命名空间，所以需要在 import 里补充引入
          path.node.left.name = REACT_SPACE
          isUseReactSpace = true
        }
      }
    },
    // 比如: Taro.useMemo(() => '', [])
    MemberExpression(path) {
      const node = path.node
      if (
        t.isIdentifier(node.property) &&
        REACT_IMPORTS.includes(node.property.name) &&
        t.isIdentifier(node.object) &&
        node.object.name === TARO_SPACE
      ) {
        node.object.name = REACT_SPACE
        isUseReactSpace = true
      }
    }
  })

  if (!reactSpecifiers.length && !isUseReactSpace) {
    return
  }

  if (reactPath) {
    // 存在 react 引入语句，将前面备用的 api 合并入已存在的 引用语句
    const specifiers = reactPath.node.specifiers
    if (isUseReactSpace) {
      // 需要引入默认的 react
      if (
        !specifiers.some(
          specifier => specifier.type === 'ImportDefaultSpecifier'
        )
      ) {
        // 不存在默认的引入时，手动构造一个
        reactSpecifiers.unshift(
          t.importDefaultSpecifier(t.identifier(REACT_SPACE))
        )
      }
    }

    reactPath.node.specifiers.push(...reactSpecifiers)
  } else {
    // 不存在 react 引入语句，在最顶层引入 react 语句
    if (isUseReactSpace) {
      // 需要引入默认的 react
      reactSpecifiers.unshift(
        t.importDefaultSpecifier(t.identifier(REACT_SPACE))
      )
    }
    const reactImport = t.importDeclaration(
      reactSpecifiers,
      t.stringLiteral(REACT_TOKEN)
    )
    if (taroPath) {
      // 提取头部的注释，避免 react 语句塞入注释前面的情况，理想情况是最上面是注释，注释下面才是我们的代码
      if (taroPath.node.leadingComments) {
        reactImport.leadingComments = taroPath.node.leadingComments
      }
      taroPath.node.leadingComments = []
      taroPath.insertBefore(reactImport)
    } else {
      ast.program.body.unshift(reactImport)
    }
  }
  return true
}

module.exports = transform
