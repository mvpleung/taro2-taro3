const config = {
  sourceType: 'module',
  plugins: [
    'jsx',
    'asyncGenerators',
    'bigInt',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'doExpressions',
    'dynamicImport',
    'exportDefaultFrom',
    'exportNamespaceFrom',
    'functionBind',
    'functionSent',
    'importMeta',
    'logicalAssignment',
    'nullishCoalescingOperator',
    'numericSeparator',
    'objectRestSpread',
    'optionalCatchBinding',
    'optionalChaining',
    [
      'pipelineOperator',
      {
        proposal: 'minimal'
      }
    ],
    [
      'decorators', {
        decoratorsBeforeExport: true
      }
    ],
    'throwExpressions',
    'typescript',
    // 'decorators-legacy' // 如果待代码中有装饰器，需要添加该plugin，才能识别
  ]
}

module.exports = config
