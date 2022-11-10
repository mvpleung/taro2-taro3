/*
 * 处理类组件的路由信息 this.$router
 * @Date: 2022-10-23 12:58:05
 * @Last Modified time: 2022-10-23 22:42:53
 */
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const { TARO_TOKEN } = require('./constant')

/** 类组件路由访问key名 */
const TARO_ROUTER_KEY = '$router'
const MEMBER_KEY = 'current'
const ROUTER_API = 'getCurrentInstance'

const transform = ast => {
  let isHandle = false // 标识位，避免重复处理
  traverse(ast, {
    MemberExpression(path) {
      const node = path.node
      if (
        !t.isIdentifier(node.property) ||
        node.property.name !== TARO_ROUTER_KEY
      ) {
        return
      }

      // 找到 this.$router 之后，转换开始，分为几步
      // import { getCurrentInstance } from '@tarojs/taro'
      // class C extends Component {
      //   current = getCurrentInstance() // ClassBody

      //   componentWillMount () {
      //     // getCurrentInstance().router 和 this.$router 和属性一样
      //     console.log(this.current.router)
      //   }
      // }

      if (isHandle) {
        // 为 true 说明引入语句和 Class 成员变量都已经处理过，只需要处理使用的地方即可
        node.property.name = MEMBER_KEY // 将 this.$router ===> this.current
        return
      }

      // 1. 先修改引入语句，增加 getCurrentInstance
      const taroImport = ast.program.body.find(
        body => t.isImportDeclaration(body) && body.source.value === TARO_TOKEN
      )
      const routerSpecifier = t.importSpecifier(
        t.identifier(ROUTER_API),
        t.identifier(ROUTER_API)
      )
      if (taroImport) {
        // 找到了 taro 的引用语句，往里塞入 api
        taroImport.specifiers.push(routerSpecifier)
      } else {
        // 没有找到 taro 的引用语句，需要手动补一个
        const routerImport = t.importDeclaration(
          [routerSpecifier],
          t.stringLiteral(TARO_TOKEN)
        )

        // 提取头部注释，避免手动补的引用语句放到最上面，理想的情况是放到注释下面
        const firstStatement = ast.program.body[0]
        if (firstStatement.leadingComments) {
          routerImport.leadingComments = firstStatement.leadingComments
        }
        firstStatement.leadingComments = []
        ast.program.body.unshift(routerImport)
      }

      // 2. 使用新语法声明一个成员变量 current = getCurrentInstance()
      // 先往上找到可以塞入类成员的地方，也就是 classBody
      path.findParent(pathNode => {
        if (t.isClassBody(pathNode.node)) {
          // 找到了可以塞入变量的地方
          pathNode.node.body.unshift(
            t.classProperty(
              t.identifier(MEMBER_KEY),
              t.callExpression(t.identifier(ROUTER_API), [])
            )
          )
          return true
        }
      })

      // 3. 替换 this.$router ==> this.current
      node.property.name = MEMBER_KEY // 将 this.$router ===> this.current

      isHandle = true
    }
  })

  return isHandle
}

module.exports = transform
