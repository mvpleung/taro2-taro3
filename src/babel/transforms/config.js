/*
 * 处理 page config
 * 提取 config 字段到 同级目录的 index.config.ts
 * @Date: 2022-10-23 12:58:05
 * @Last Modified time: 2022-10-23 22:52:05
 */
const fs = require('fs')
const traverse = require('@babel/traverse').default
const generate = require('@babel/generator').default
const t = require('@babel/types')
const { mkDirsSync } = require('../../util')
const { TARO_SPACE, TARO_TOKEN } = require('./constant')

/** 配置项目的字段名 */
const TARO_CONFIG_KEY = 'config'

const transform = (ast, filePath, distPath) => {
  // 存储所有名字与 config 吻合的配置，因为我们是按类型检索，所以这里暂时判断不了是变量 config 还是配置 config
  // { miniConfig: { path, specifiers } }
  const allConfigSpecifiers = {}
  let pageConfigSpecifiers = [] // 存储提取出来的页面配置
  traverse(ast, {
    // 处理类组件挂载的 config
    ClassProperty(path) {
      const node = path.node
      if (!t.isIdentifier(node.key) || node.key.name !== TARO_CONFIG_KEY) {
        return
      }
      if (!t.isObjectExpression(node.value)) {
        return
      }
      pageConfigSpecifiers = node.value.properties
      // 删除原有 config 节点
      path.remove()
    },
    // 提取函数式组件挂载的 config
    AssignmentExpression(path) {
      const node = path.node
      if (node.operator !== '=') {
        return
      }

      if (
        !(
          t.isMemberExpression(node.left) &&
          t.isIdentifier(node.left.object) &&
          t.isIdentifier(node.left.property) &&
          node.left.property.name === TARO_CONFIG_KEY
        )
      ) {
        return
      }

      if (!t.isObjectExpression(node.right)) {
        return
      }

      // 前置条件校验通过，存入临时集合，用于后续判断
      allConfigSpecifiers[node.left.object.name] = {
        path,
        specifiers: node.right.properties
      }
    },
    // 提取函数式组件名
    ExportDefaultDeclaration(path) {
      if (!t.isIdentifier(path.node.declaration)) {
        return
      }
      const findPath = allConfigSpecifiers[path.node.declaration.name]
      if (findPath) {
        pageConfigSpecifiers = findPath.specifiers
        findPath.path.remove()
      }
    }
  })

  if (!pageConfigSpecifiers.length) {
    return
  }

  // 拿到配置之后，开始讲配置写入到同级目录的 config.ts 文件中去

  // 1. 生成 AST 树
  const exportDefault = t.exportDefaultDeclaration(
    t.objectExpression(pageConfigSpecifiers)
  )

  const astBody = []

  const code = generate(exportDefault).code

  // 检查是否使用了 Taro 关键字，主要针对函数式组件
  const isUsedTaro = code.includes('Taro.') || code.includes('Taro[') // 这里偷个懒

  if (isUsedTaro) {
    astBody.push(
      t.importDeclaration(
        [t.importDefaultSpecifier(t.identifier(TARO_SPACE))],
        t.stringLiteral(TARO_TOKEN)
      )
    )
  }
  astBody.push(exportDefault)
  const astCode = t.program(astBody)

  // 2. 提取页面文件名，因为 config 的文件名字要跟页面的名字一一对应，比如 pages/index/index.tsx  pages/index/index.config.ts
  const fileName = filePath.slice(
    filePath.lastIndexOf('/') + 1,
    filePath.indexOf('.')
  )
  const configFileName = `${fileName}.config.ts`
  mkDirsSync(distPath)
  fs.writeFileSync(`${distPath}/${configFileName}`, generate(astCode).code)
  return true
}

module.exports = transform
