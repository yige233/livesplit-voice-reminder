# 连接到 liveSplit，然后根据分段名称，自动播放预定义的提示词

用 [node-livesplit-client](https://github.com/satanch/node-livesplit-client)连接到 LiveSplit Server；循环读取当前的分段，检测到进入新分段后，检测该分段对应的提示词，之后用[edge-tts-go](https://github.com/wujunwei928/edge-tts-go)调用微软在线 tts 服务生成提示词语音，最后用 ffplay 播放提示词

## 使用方法：

1. 新建并编辑`提示词.txt`，设定好需要的提示词
2. 打开 LiveSplit TCP Server。右键 LiveSplit > Control > Start TCP Server
3. 将第一步中编辑好的`提示词.txt`拖动到`启动.cmd`上打开。

提示词格式：分段名+英文冒号+提示词，每行一个

例子:

```
德特茅斯:欢迎来到德特茅斯
```

但是在线文本转语音，会有一定的延迟。所以可以使用本地音频。

如果提示词以".mp3"结尾，会被认为是本地音频，然后程序会在 voice 文件夹中查找同名音频，并播放。

```
白波:18.mp3
```

有一些保留的提示词名称：

- `voice`
- `voice-filter`

`voice`用于修改语音源，例如：`voice:zh-CN-XiaoxiaoNeural`

`voice-filter`用于查询可用的语音源。例如：`voice-filter:zh-cn,female`，程序会在启动时查找语种为中文、声音性别为女的语音源。
要查找的选项为两部分，用`,`分隔。第一部分是音源的语种地区代码；第二部分是音源的性别。可以不指定性别，这样做会使程序返回所有性别的语音源。
