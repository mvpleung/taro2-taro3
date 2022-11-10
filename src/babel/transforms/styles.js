/*
 * 处理样式，移除 externalClasses、addGlobalClass
 * @Date: 2022-10-23 12:58:05
 * @Last Modified time: 2022-10-23 22:43:12
 */
const traverse = require('@babel/traverse').default

const STYLE_CONFIG_KEYS = ['externalClasses', 'addGlobalClass']

const transform = ast => {
  let isHandle = false
  traverse(ast, {
    ClassProperty(path) {
      const node = path.node
      if (node.static && STYLE_CONFIG_KEYS.includes(node.key.name)) {
        path.remove()
        isHandle = true
      }
    }
  })
  return isHandle
}

module.exports = transform
