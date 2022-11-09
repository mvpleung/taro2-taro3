const fs = require('fs')
const path = require('path')
const chalk = require('chalk')

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 * @param extnames 需要的文件后缀
 */
function getAllFilePath(filePath, extnames) {
  //根据文件路径读取文件，返回文件列表
  const filePaths = []
  const files = fs.readdirSync(filePath)
  files.forEach(function (filename) {
    //获取当前文件的绝对路径
    const fileDir = path.join(filePath, filename)
    const stats = fs.statSync(fileDir)
    if (stats.isFile()) {
      const extname = fileDir.endsWith('.d.ts')
        ? '.d.ts'
        : path.extname(fileDir)
      if (extname) {
        // 存在后缀才压入数组，说明是正常的文件，过滤掉 .DS_Store 这种文件
        if (!extnames || (extnames && extnames.includes(extname.slice(1)))) {
          filePaths.push(fileDir)
        }
      }
    } else if (stats.isDirectory()) {
      filePaths.push(...getAllFilePath(fileDir, extnames))
    }
  })
  return filePaths
}

/**
 * 递归创建目录 同步方法
 * @param {string} dirname 目录
 * @param {boolean} [isUseRoot=true] 是否使用默认根路径
 * @returns {boolean}
 */
function mkDirsSync(dirname) {
  if (fs.existsSync(dirname)) {
    return true
  }
  if (mkDirsSync(path.dirname(dirname), false)) {
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname)
    }
    return true
  }
  return false
}

/**
 * 递归删除目录 同步方法
 * @param {string} dirname 目录
 * @returns {boolean}
 */
function rmDirsSync(targetPath) {
  try {
    if (!fs.existsSync(targetPath)) {
      // 目录不存在时，认为已经被删除掉
      return true
    }
    if (fs.statSync(targetPath).isFile()) {
      fs.unlinkSync(targetPath)
      targetPath = path.dirname(targetPath)
    }
    let files = []
    if (fs.existsSync(targetPath)) {
      files = fs.readdirSync(targetPath)
      files.forEach(file => {
        let curPath = targetPath + '/' + file
        if (fs.statSync(curPath).isDirectory()) {
          // recurse
          if (!rmDirsSync(curPath)) return false
        } else {
          // delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(targetPath)
    }
  } catch (e) {
    console.error(
      'optimize rmDirsSync 失败: path=' + targetPath + ' errorMsg:' + e
    )
    return false
  }
  return true
}

function onProgress({ status = 'doing', color = 'green', message = '' }) {
  console.log(
    chalk[color](status),
    status.length < 5 ? new Array(5 - status.length + 1).join(' ') : '',
    chalk.blue(message)
  )
}

module.exports = {
  getAllFilePath,
  mkDirsSync,
  rmDirsSync,
  onProgress
}
