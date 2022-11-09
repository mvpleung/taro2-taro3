/*
 * 这是类组件
 * @Date: 2022-11-09 19:29:45
 * @Last Modified time: 2022-11-09 19:29:45
 */
import Taro from '@tarojs/taro'
import { WebView } from '@tarojs/components'

export default class AdWebview extends Taro.Component {
  config = {
    navigationBarTitleText: '活动浏览器'
  }

  state = {
    webSrc: ''
  }

  componentWillMount() {
    console.log(this.$router.params)
  }

  render() {
    const { webSrc } = this.state
    return <WebView src={webSrc} />
  }
}
