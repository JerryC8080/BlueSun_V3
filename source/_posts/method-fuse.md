---
title: 函数保险丝：避免函数过热调用
category: 搬砖码农
date: 2021-1-28 15:34:00
---

  <img src="https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20210128154439.png" width=300 />

## 前言

在日常开发中，我们会遇到很多这样的场景：

1. 在抢购活动中，用户往往会频繁刷新接口，要给接口加上防护，频繁调用停止响应。
2. 在弱网环境中，往往会实现失败重试功能，如果失败次数多了，频繁的重试需要制止。
3. 在股票市场中，当价格波动的幅度在交易时间中达到某一个限定的熔断点时，对其暂停交易一段时间的机制。
4. ......

这类问题，本质是：**「过热的调用」**

在物理电路中，对于「过热的调用」有一种大家生活中都常见的电子元件：**保险丝**

保险丝会在电流异常升高到一定的高度和热度的时候，自身熔断切断电流，保护电路安全运行。

我们可以模仿这样的思路，去解决编程中的「过热的调用」问题：

1. 设定一个阈值，如果函数在短时间内调用次数达到这个阈值，就熔断一段时间。
2. 在函数有一段时间没有被调用了，让函数的热度降下来。



## 函数保险丝的功能实现

基于以上的思路，我实现了一个 npm 库：[Method Fuse](https://github.com/JerryC8080/method-fuse)

使用方式如下：

### Step1：安装

`npm install @jerryc/method-fuse`

### Step2：快速使用

```javascript
import { MethodFuse } from '@jerryc/method-fuse';

// 一个请求远程资源的异步函数
const getAssets = async () => API.requestAssets();

// 创建 MethodFuse 实例
const fuse = new MethodFuse({
  // 命名，用于日志输出
  name: 'TestFuse',

  // 最大负荷，默认：3
  maxLoad: 3,

  // 每次熔断时间。每次熔断之后，间隔 N 毫秒之后重铸，默认：5000ms
  breakingTime: 5000,

  // 自动冷却时间。在最后一次调用间隔 N 毫秒之后自动重铸，默认：1000ms
  coolDownTime: 1000,
});

// 代理原函数
const getAssetsProxy = fuse.proxy(getAssets);

// 高频并发调用 getAssetsProxy。
getAssetsProxy();
getAssetsProxy();
getAssetsProxy();
getAssetsProxy(); // 此次调用会熔断
setTimeout(() => getAssetsProxy(), 5000); // 等待熔断重铸后，方可重新调用。

// 以上会打印日志：
// [method-fuse:info] TestFuse-通过保险丝(1/3)
// [method-fuse:info] TestFuse-通过保险丝(2/3)
// [method-fuse:info] TestFuse-通过保险丝(3/3)
// [method-fuse:error] TestFuse-保险丝熔断，5000ms 之后重铸
// [method-fuse:info] TestFuse-保险丝重置
// [method-fuse:info] TestFuse-通过保险丝(1/3)
```

### Step3：使用装饰器

如果你的项目中支持 `TS` 或者 `ES Decorator`，那么 `MethodFuse` 提供了快捷使用的装饰器。

```javascript
import { decorator as methodFuse } from '@jerryc/method-fuse';

@methodFuse({ name: 'TestFuse' })
async function getAsset() {
  return API.requestAssets();
};
```

### Step4：修改日志级别

`MethodFuse` 内置了一个迷你 logger（power by [@jerryc/mini-logger](https://github.com/JerryC8080/mini-logger)），方便内部日志打印，外部可以获得 `Logger` 的实例，进行 log level 的控制。

```javascript
import { LoggerLevel } from '@jerryc/mini-logger';
import { logger, MethodFuse } from '@jerryc/method-fuse';

// 创建 MethodFuse 实例
const MethodFuse = new MethodFuse({ name: 'TestFuse' });

// 下调 Log level
logger.level = LoggerLevel.ERROR;
```



















