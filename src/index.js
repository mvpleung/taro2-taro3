const fs = require('fs')
const path = require('path')
const parser = require('@babel/parser')
const recast = require('recast')
// const generate = require('@babel/generator').default
const {
  getAllFilePath,
  mkDirsSync,
  rmDirsSync,
  onProgress
} = require('./util')

const ParserConfig = require('./babel/ast.config.ts')
const transforms = require('./babel/transforms')

const rootPath = path.resolve(process.env.PWD, 'src/example')

const filePaths = getAllFilePath(rootPath, ['tsx', 'ts', 'jsx', 'js'])

const distRoot = path.resolve(process.env.PWD, 'dist')

// 删除输出目录
rmDirsSync(distRoot)

filePaths.forEach(filePath => {
  const source = fs.readFileSync(filePath).toString()
  const ast = parser.parse(source, ParserConfig)

  const relativePath = filePath.slice(
    rootPath.length + 1,
    filePath.lastIndexOf('/')
  )

  const distPath = path.join(distRoot, relativePath)

  const result = transforms.map(transformFn =>
    transformFn(ast, filePath, distPath)
  )

  if (!result.includes(true)) {
    onProgress({
      status: 'SKIP',
      message: filePath,
      color: 'yellow'
    })
    return
  }

  mkDirsSync(distPath)
  // const code = generate(ast).code // generate 生成的代码不能保持格式化，这里使用 recast 来代替
  const code = recast.print(ast, {
    quote: 'single',
    useTabs: false,
    tabWidth: 2,
    wrapColumn: 80
  }).code
  fs.writeFileSync(
    `${distPath}/${filePath.slice(filePath.lastIndexOf('/') + 1)}`,
    code
  )
  onProgress({
    status: 'DONE',
    message: filePath
  })
})
