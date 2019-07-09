---
title: BeautyWe.js 一套专注于微信小程序的开发范式
category: 搬砖码农
date: 2019-06-11 14:22:25
tags: 
- 小程序
---


![](https://raw.githubusercontent.com/beautywe/docs/master/docs/assets/images/logo-V4.png)


> 官网：[beautywejs.com](http://beautywejs.com)    
> Repo: [beautywe](https://github.com/beautywe/beautywe)


# 一个简单的介绍

**BeautyWe.js 是什么？**

它是一套专注于微信小程序的企业级开发范式，它的愿景是：

> 让企业级的微信小程序项目中的代码，更加简单、漂亮。

**为什么要这样命名呢？**

> Write **beautiful** code for **we**chat mini program by the **beautiful** **we**!

「We」 既是我们的 **We**，也是微信的 **We**，Both beautiful！

**那么它有什么卖点呢？**

1. 专注于微信小程序环境，写原汁原味的微信小程序代码。
2. 由于只专注于微信小程序，它的源码也很简单。
3. 插件化的编程方式，让复杂逻辑更容易封装。
4. 再加上一些配套设施：
    1. 一些官方插件。
    2. 一套开箱即用，包含了工程化、项目规范以及微信小程序环境独特问题解决方案的框架。
    3. 一个CLI工具，帮你快速创建应用，页面，组件等。

**它由以下几部分组成：**

* **一个插件化的核心** - [BeautyWe Core](https://github.com/beautywe/beautywe)    
    对 App、Page 进行抽象和包装，保持传统微信小程序开发姿势，同时开放部分原生能力，让其具有「可插件化」的能力。

* **一些官方插件** — [BeautyWe Plugins](https://www.npmjs.com/search?q=keywords%3Abeautywe-plugin)    
    得益于 Core 的「可插件化」特性，封装复杂逻辑，实现可插拔。官方对于常见的需求提供了一些插件：如增强存储、发布/订阅、状态机、Logger、缓存策略等。

* **一套开箱即用的项目框架** - [BeautyWe Framework](https://user-gold-cdn.xitu.io/2019/6/10/16b40250bcbe53fb#/contents/framework/introduce)    
    描述了一种项目的组织形式，开箱即用，集成了 `BeautyWe Core` ，并且提供了如：全局窗口、开发规范、多环境开发、全局配置、NPM 等解决方案。

* **一个CLI工具** - [BeautyWe Cli](https://user-gold-cdn.xitu.io/2019/6/10/16b40250bcbe53fb#/remote/cli)    
    提供快速创建应用、页面、插件，以及项目构建功能的命令行工具。并且还支持自定义的创建模板。

# 一个简单的例子

下载

![](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181427)

用 BeautyWe 包装你的应用

![](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181445)

之后，你就能使用 BeautyWe Plugin 提供的能力了。

![](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181337)

# 开放原生App/Page，支持插件化

`new BtApp({...})` 的执行结果是对原生的应用进行包装，其中包含了「插件化」的处理，然后返回一个新的实例，这个实例适配原生的 `App()` 方法。

下面来讲讲「插件化」到底做了什么事情。

首先，插件化开放了原生 App 的四种能力：

1. **Data 域**
    把插件的 Data 域合并到原生 App 的 Data 域中，这一块很容易理解。
    
2. **原生钩子函数**
    使原生钩子函数（如 `onShow`, `onLoad`）可插件化。让原生App与多个插件可以同时监听同一个钩子函数。如何工作的，下面会细说。
    
3. **事件钩子函数**
    使事件钩子函数（与 view 层交互的钩子函数），尽管在实现上有一些差异，但是实现原理跟「原生钩子函数」一样的。

4. **自定义方法**
    让插件能够给使用者提供 API。为了保证插件提供的 API 足够的优雅，支持当调用插件 API 的时候（如 event 插件 `this.event.on(...)`)，API 方法内部仍然能通过 `this` 获取到原生实例。

#### 钩子函数的插件化

原生钩子函数，事件钩子函数我们统一称为「钩子函数」。

对于每一个钩子函数，内部是维护一个以 Series Promise 方式执行的执行队列。

以 `onShow` 为例，将会以这样的形式执行：

> native.onShow → pluginA.onShow → pluginB.onShow → ...

**下面深入一下插件化的原理**：

![beautywe pluggable](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181648)

工作原理是这样的：    
1. 经过 `new BtApp(...)` 包装，所有的钩子函数，都会有一个独立的执行队列，    
2. 首先会把原生的各个钩子函数 `push` 到对应的队列中。然后每 `use` 插件的时候，都会分解插件的钩子函数，往对应的队列 `push`。    
3. 当 `Native App`（原生）触发某个钩子的时候，`BtApp` 会以 Promise Series 的形式按循序执行对应队列里面的函数。    
4. 特殊的，`onLaunch` 和 `onLoad` 的执行队列中，会在队列顶部插入一个初始化的任务（`initialize`），它会以同步的方式按循序执行 `Initialize Queue` 里面的函数。这正是插件生命周期函数中的 `plugin.initialize`。

这种设计能提供以下功能：
1. 可插件化。
    只需要往对应钩子函数的事件队列中插入任务。
    
2. 支持异步。
    由于是以 Promise Series 方式运行的，其中一个任务返回一个 Promise，下一个任务会等待这个任务完成再开始。如果发生错误，会流转到原生的 `onError()` 中。
    
3. 解决了微信小程序 `app.js` 中 `getApp() === undefinded `问题。
    造成这个问题，本质是因为 `App()` 的时候，原生实例未创建。但是由于 Promise 在 event loop 中是一个微任务，被注册在下一次循环。所以 Promise 执行的时候 `App()` 早已经完成了。

# 一些官方插件

BeautyWe 官方提供了一系列的插件：

1. 增强存储: Storage
2. 数据列表：List Page
3. 缓存策略：Cache
4. 日志：Logger
5. 事件发布/订阅：Event
6. 状态机：Status

它们的使用很简单，哪里需要插哪里。
由于篇幅的原因，下面挑几个比较有趣的来讲讲，更多的可以看看官方文档：[BeautyWe](http://beautywejs.com)

## 增强存储 Storage

该功能由 [@beautywe/plugin-storage](https://github.com/beautywe/plugin-storage) 提供。

由于微信小程序原生的数据存储生命周期跟小程序本身一致，即除用户主动删除或超过一定时间被自动清理，否则数据都一直可用。

所以该插件在 `wx.getStorage/setStorage` 的基础上，提供了两种扩展能力：

1. 过期控制
2. 版本隔离


**一些简单的例子**

安装
```javascript
import { BtApp } from '@beautywe/core';
import storage from '@beautywe/plugin-storage';

const app = new BtApp();
app.use(storage());
```

过期控制
```javascript
// 7天后过期
app.storage.set('name', 'jc', { expire: 7 })；
```

版本隔离
```javascript
app.use({ appVersion: '0.0.1' });
app.set('name', 'jc');

// 返回 jc
app.get('name');

// 当版本更新后
app.use({ appVersion: '0.0.2' });

// 返回 undefined;
app.get('name');
```

更多的查看 [@beautywe/plugin-storage 官方文档](https://github.com/beautywe/plugin-storage)

## 数据列表 List Page

对于十分常见的数据列表分页的业务场景，`@beautywe/plugin-listpage` 提供了一套打包方案：

1. 满足常用「数据列表分页」的业务场景
2. 支持分页
3. 支持多个数据列表
4. 自动捕捉下拉重载：`onPullDownRefresh`
5. 自动捕捉上拉加载：`onReachBottom`
6. 自带请求锁，防止帕金森氏手抖用户
7. 简单优雅的 API


一个简单的例子：

```javascript
import BeautyWe from '@beautywe/core';
import listpage from '@beautywe/plugin-listpage';

const page = new BeautyWe.BtPage();

// 使用 listpage 插件
page.use(listpage({
    lists: [{
        name: 'goods',  // 数据名
        pageSize: 20,   // 每页多少条数据，默认 10

        // 每一页的数据源，没次加载页面时，会调用函数，然后取返回的数据。
        fetchPageData({ pageNo, pageSize }) {
        
            // 获取数据
            return API.getGoodsList({ pageNo, pageSize })
            
                // 有时候，需要对服务器的数据进行处理，dataCooker 是你定义的函数。
                .then((rawData) => dataCooker(rawData));
        },
    }],
    enabledPullDownRefresh: true,    // 开启下拉重载， 默认 false
    enabledReachBottom: true,    // 开启上拉加载， 默认 false
}));

// goods 数据会被加载到，goods 为上面定义的 name
// this.data.listPage.goods = {
//     data: [...],     // 视图层，通过该字段来获取具体的数据
//     hasMore: true,   // 视图层，通过该字段来识别是否有下一页
//     currentPage: 1,  // 视图层，通过该字段来识别当前第几页
//     totalPage: undefined,
// }
```

只需要告诉 `listpage` 如何获取数据，它会自动处理「下拉重载」、「上拉翻页」的操作，然后把数据更新到 `this.data.listPage.goods` 下。

View 层只需要描述数据怎么展示：

```html
<view class="good" wx:for="listPage.goods.data">
    ...
</view>
<view class="no-more" wx:if="listPage.goods.hasMore === false">
    没有更多了
</view>
```

`listpage` 还支持多数据列表等其他更多配置，详情看：[@beautywe/plugin-listpage](https://github.com/beautywe/plugin-listpage)

## 缓存策略 Cache

`@beautywe/plugin-cache` 提供了一个微信小程序端缓存策略，其底层由 [super-cache](https://github.com/JerryC8080/super-cache) 提供支持。

#### 特性
  1. 提供一套「服务端接口耗时慢，但加载性能要求高」场景的解决方案
  2. 满足最基本的缓存需求，读取（get）和保存（set）
  2. 支持针对缓存进行逻辑代理
  3. 灵活可配置的数据存储方式

#### How it work

一般的请求数据的形式是，页面加载的时候，从服务端获取数据，然后等待数据返回之后，进行页面渲染：

![](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181755)

但这种模式，会受到服务端接口耗时，网络环境等因素影响到加载性能。   

对于加载性能要求高的页面（如首页），一般的 Web 开发我们有很多解决方案（如服务端渲染，服务端缓存，SSR 等）。      
但是也有一些环境不能使用这种技术（如微信小程序）。

Super Cache 提供了一个中间数据缓存的解决方案：

![](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181847)

思路：    
1. 当你需要获取一个数据的时候，如果有缓存，先把旧的数据给你。
2. 然后再从服务端获取新的数据，刷新缓存。
3. 如果一开始没有缓存，则请求服务端数据，再把数据返回。
4. 下一次请求缓存，从第一步开始。

这种解决方案，舍弃了一点数据的实时性（非第一次请求，只能获取上一次最新数据），大大提高了前端的加载性能。    
适合的场景：    
1. 数据实时性要求不高。
2. 服务端接口耗时长。

#### 使用

```javascript
import { BtApp } from '@beautywe/core';
import cache from '@beautywe/plugin-cache';

const app = new BtApp();
app.use(cache({
    adapters: [{
        key: 'name',
        data() {
            return API.fetch('xxx/name');
        }
    }]
}));
```

假设 `API.fetch('xxx/name')` 是请求服务器接口，返回数据：`data_from_server`

那么：

```javascript
app.cache.get('name').then((value) => {
    // value: 'data_from_server'  
});
```

更多的配置，详情看：[@beautywe/plugin-cache](https://github.com/beautywe/plugin-cache)


## 日志 Logger

由 `@beautywe/logger-plugin` 提供的一个轻量的日志处理方案，它支持：

1. 可控的 log level
2. 自定义前缀
3. 日志统一处理

#### 使用

```javascript
import { BtApp } from '@beautywe/core';
import logger from '@beautywe/plugin-logger';

const page = new BtApp();

page.use(logger({
    // options
}));
```

**API**

```javascript
page.logger.info('this is info');
page.logger.warn('this is warn');
page.logger.error('this is error');
page.logger.debug('this is debug');

// 输出
// [info] this is info
// [warn] this is warn
// [error] this is error
// [debug] this is debug
```

**Level control**

可通过配置来控制哪些 level 该打印：

```javascript
page.use(logger({
    level: 'warn',
}));
```

那么 `warn` 以上的 log （`info`, `debug`）就不会被打印，这种满足于开发和生成环境对 log 的不同需求。

level 等级如下：

```javascript
Logger.LEVEL = {
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
};
```

更多的配置，详情看：[@beautywe/plugin-logger](https://github.com/beautywe/plugin-logger)


# BeautyWe Framework

`@beautywe/core` 和 `@beautywe/plugin-...` 给小程序提供了：

1. 开放原生，支持插件化 —— by core
2. 各种插件 —— by plugins

但是，还有很多的开发中实际还会遇到的痛点，是上面两个解决不到的。
如项目的组织、规范、工程化、配置、多环境等等

这些就是，「BeautyWe Framework」要解决的范畴。

它作为一套开箱即用的项目框架，提供了这些功能：

* 集成 BeautyWe Core
* NPM 支持
* 全局窗口
* 全局 Page，Component
* 全局配置文件
* 多环境开发
* Example Pages
* 正常项目需要的标配：ES2015+,sass,uglify,watch 等
* 以及我们认为良好的项目规范（eslint，commit log，目录结构等）

也是由于篇幅原因，挑几个有趣的来讲讲，更多的可以看看官方文档：[BeautyWe](http://beautywejs.com)

## 快速创建

首先安装 `@beautywe/cli`

```shell
$ npm i @beautywe/cli -g
```


#### 创建应用
```shell
$ beautywe new app

> appName: my-app
> version: 0.0.1
> appid: 123456
> 这样可以么:
> {
>    "appName": "my-app",
>    "version": "0.0.1",
>    "appid": "123456"
> }
```

回答几个问题之后，项目就生成了：

```shell
my-app
├── gulpfile.js
├── package.json
└── src
    ├── app.js
    ├── app.json
    ├── app.scss
    ├── assets
    ├── components
    ├── config
    ├── examples
    ├── libs
    ├── npm
    ├── pages
    └── project.config.json
```

#### 创建页面、组件、插件

**页面**
1. 主包页面：`beautywe new page <path|name>`
2. 分包页面：`beautywe new page --subpkg <subPackageName> <path|name>`

**组件**
1. `beautywe new component <name>`

**插件**
1. `beautywe new plugin <name>`

#### 自定义模板

在 `./.templates` 目录中，存放着快速创建命令的创建模板：

```shell
$ tree .templates

.templates
├── component
│   ├── index.js
│   ├── index.json
│   ├── index.scss
│   └── index.wxml
├── page
│   ├── index.js
│   ├── index.json
│   ├── index.scss
│   └── index.wxml
└── plugin
    └── index.js
```

可以修改里面的模板，来满足项目级别的自定义模板创建。

## 全局窗口

我们都知道微信小程序是「单窗口」的交互平台，一个页面对应一个窗口。    
而在业务开发中，往往会有诸如这种述求：

1. 自定义的 toast 样式
2. 页面底部 copyright
3. 全局的 loading 样式
4. 全局的悬浮控件    
......

稍微不优雅的实现可以是分别做成独立的组件，然后每一个页面都引入进来。    
这种做法，我们会有很多的重复代码，并且每次新建页面，都要引入一遍，后期维护也会很繁琐。

而「全局窗口」的概念是：**希望所有页面之上有一块地方，全局性的逻辑和交互，可以往里面搁。**

#### global-view 组件

这是一个自定义组件，源码在 `/src/components/global-view`

每个页面的 wxml 只需要在顶层包一层：

```html
<global-view id="global-view">
    ...
</global-view>
```

需要全局实现的交互、样式、组件，只需要维护这个组件就足够了。

## 全局配置文件

在 `src/config/` 目录中，可以存放各种全局的配置文件，并且支持以 Node.js 的方式运行。（得益于 [Node.js Power 特性](/contents/framework/concept/nodejs-power.md)）。

如 `src/config/logger.js`:

```javascript
const env = process.env.RUN_ENV || 'dev';

const logger = Object.assign({
    prefix: 'BeautyWe',
    level: 'debug',
}, {
    // 开发环境的配置
    dev: {
        level: 'debug',
    },
    // 测试环境的配置
    test: {
        level: 'info',
    },
    // 线上环境的配置
    prod: {
        level: 'warn',
    },
}[env] || {});

module.exports.logger = logger;
```

然后我们可以这样读取到 config 内容：

```javascript
import { logger } from '/config/index';

// logger.level 会根据环境不同而不同。
```

Beautywe Framework 默认会把 config 集成到 `getApp()` 的示例中：

```javascript
getApp().config;
```

## 多环境开发

BeautyWe Framework 支持多环境开发，其中预设了三套策略：
* dev
* test
* prod

我们可以通过命令来运行这三个构建策略：

```shell
beautywe run dev
beautywe run test
beautywe run prod
```

## 三套环境的差异

Beautywe Framework 源码默认在两方面使用了多环境：

* 构建任务（`gulpfile.js/env/...`）
* 全局配置（`src/config/...`）

### 构建任务的差异

| 构建任务 | 说明 |dev | test | prod |
|---|---|:---:|:---:|:---:|
| clean | 清除dist文件 | √ | √ | √ |
| copy | 复制资源文件 | √ | √ | √ |
| scripts | 编译JS文件 | √ | √ | √ |
| sass | 编译scss文件 | √ | √ | √ |
| npm | 编译npm文件 | √ | √ | √ |
| nodejs-power | 编译Node.js文件 | √ | √ | √ |
| watch | 监听文件修改 | √ | | |
| scripts-min | 压缩JS文件 |  |  | √ |
| sass-min | 压缩scss文件 |  |  | √ |
| npm-min | 压缩npm文件 | | | √ |
| image-min | 压缩图片文件 |  |  | √ |
| clean-example | 清除示例页面 | | | √ |


### Node.js Power

Beautywe Framework 的代码有两种运行环境：

1. Node.js 运行环境，如构建任务等。
2. 微信小程序运行环境，如打包到 `dist` 文件夹的代码。

#### 运行过程

> Node.js Power 本质是一种静态编译的实现。    
> 把某个文件在 Node.js 环境运行的结果，输出到微信小程序运行环境中，以此来满足特定的需求。

Node.js Power 会把项目中 `src` 目录下类似 `xxx.nodepower.js` 命名的文件，以 Node.js 来运行，    
然后把运行的结果，以「字面量对象」的形式写到 `dist` 目录下对应的同名文件 `xxx.nodepower.js` 文件去。

以 `src/config/index.nodepower.js` 为例：

```javascript
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(path.join(__dirname));

const result = {};

files
    .filter(name => name !== 'index.js')
    .forEach((name) => {
        Object.assign(result, require(path.join(__dirname, `./${name}`)));
    });

module.exports = result;
```

该文件，经过 Node.js Power 构建之后:

`dist/config/index.nodepower.js`: 

```javascript
module.exports = {
    "appInfo": {
        "version": "0.0.1",
        "env": "test",
        "appid": "wx85fc0d03fb0b224d",
        "name": "beautywe-framework-test-app"
    },
    "logger": {
        "prefix": "BeautyWe",
        "level": "info"
    }
};
```

这就满足了，随意往 `src/config/` 目录中扩展配置文件，都能被自动打包。

Node.js Power 已经被集成到多环境开发的 dev, test, prod 中去。

当然，你可以手动运行这个构建任务：

```shell
$ gulp nodejs-power
```

### NPM

BeautyWe Framework 实现支持 npm 的原理很简单，总结一句话：

> 使用 webpack 打包 `src/npm/index.js` ，以 commonjs 格式输出到 `dist/npm/index.js`

![npm-works](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20190707181936)

这样做的好处：

1. 实现简单。
2. 让 npm 包能集中管理，每次引入依赖，都好好的想一下，避免泛滥（尤其在多人开发中）。
3. 使用 `ll dist/npm/index.js` 命令能快速看到项目中的 npm 包使占了多少容量。

#### 新增 npm 依赖

在 `src/npm/index.js` 文件中，进行 export：

```javscript
export { default as beautywe } from '@beautywe/core';
```

然后在其他文件 import：

```javascript
import { beautywe } from './npm/index';
```

# 更多

总的来说，BeautyWe 是一套微信小程序的开发范式。

`core` 和 `plugins` 扩展原生，提供复杂逻辑的封装和插拔式使用。

而 `framework` 则负责提供一整套针对于微信小程序的企业级项目解决方案，开箱即用。

其中还有更多的内容，欢迎浏览官网：[beautywejs.com](http://beautywejs.com)

