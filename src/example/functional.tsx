/*
 * 这是一段注释
 * @Date: 2022-11-09 19:29:45
 * @Last Modified time: 2022-11-09 19:29:45
 */
import Taro, { useDidShow, useEffect, useRouter, useState } from '@tarojs/taro'
import { View } from '@tarojs/components'

const Index: Taro.FC = () => {
  const routerInfo = useRouter()
  const [name, setName] = Taro.useState<string>('')

  useDidShow(() => {})

  useEffect(() => {
    console.log('首页')
  }, [])

  return <View>{name}</View>
}

Index.config = {
  navigationBarTitleText: '首页',
}

export default Index
