---
title: 微信小程序路由实战
category: 搬砖码农
date: 2021-03-21 20:28:00
tags: 
- 微信小程序
---

# 0. 目录

- [1. 前言](#1-前言)
- [2. 智能路由跳转 — Navigator 模块](#2-智能路由跳转--navigator-模块)
- [3. 虚拟路由策略 — Router 模块](#3-虚拟路由策略--router-模块)
- [4. 落地中转策略 — LandTransfer 模块](#4-落地中转策略--landtransfer-模块)
  - [4.1. 对于要解决的第一个问题：统一的落地页](#41-对于要解决的第一个问题统一的落地页)
  - [4.2. 对于第二个要解决的问题：短链参数](#42-对于第二个要解决的问题短链参数)
  - [4.3. LandTransfer 模块设计](#43-landtransfer-模块设计)
- [5. 更好的开发体验](#5-更好的开发体验)
  - [5.1. Typescript + Router](#51-typescript--router)
  - [5.2. 智能生成路由配置](#52-智能生成路由配置)
  - [5.3. 自定义组件跳转](#53-自定义组件跳转)
- [6. 整体架构图](#6-整体架构图)
- [7. 最后的最后](#7-最后的最后)

# 1. 前言

在微信小程序由一个 `App()`实例，和众多`Page()`组成。而在小程序中所有页面的路由全部由框架进行管理，框架以栈的形式维护了所有页面，然后提供了以下 API 来进行路由之间的跳转：
1. `wx.navigateTo`
2. `wx.redirectTo`
3. `wx.navigateBack`
4. `wx.switchTab`
5. `wx.reLaunch` 

但是，对于一个企业应用，把这些问题留给了开发者：

1. 原生 API 使用了 `Callback` 的函数实现形式，与我们现代普遍的 `Promise` 和 `async/await` 存在 gap。
2. 基于小程序路由的设计，暴露给外部的是真实路由（如扫码，公众号链接等方式），对后续项目重构留下历史包袱。
3. 小程序页面栈最多十层， 在超过十层后 `wx.navigateTo` 失效，需要开发者判断使用 `wx.redirectTo` 或其他API
4. 小程序页面栈存在一种特殊的页面：Tab 页面，需要使用 `wx.switchTab` 才能跳转。需要开发者主动判断，不方便后期改动 Tab 页面属性。
5. 额外的，对于小程序码，要使用无数量限制 API [wxacode.getUnlimited](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html) ，存在参数长度限制32位以内。需要开发者自行解决。

而本文，期望能对这若干问题，逐个提供解决方案。



# 2. 智能路由跳转 — Navigator 模块

在这里我们一起解决：

1. 原生 API 非 Promsie
2. 页面栈突破十层时特殊处理
3. 特殊页面 Tab 的跳转处理

我们的思路是，希望能设计一种逻辑，根据场景来自动判断使用哪个微信路由 API，然后对外只提供一个函数，例如：

```javascript
gotoPage('/pages/goods/index')
```

具体逻辑如下：

1. 当跳转的路由为小程序 tab 页面时，则使用 `wx.switchTab`。
2. 当页面栈达到 10 层之后，如果要跳转的页面在页面栈中，使用 `wx.navigateBack({ delta: X })` 出栈到目标页面。
3. 当页面栈达到 10 层之后，目标页面不存在页面栈中，使用 `wx.redirectTo` 替换栈顶页面。
4. 其他情况使用 `wx.navigateTo`

顺带的，我们把这个函数以 Promise 形式实现，以及支持参数作为 `object`传入，例如：

```javascript
gotoPage('/pages/goods/index', { name: 'jc' }).then(...).catch(...);
```

大部分场景下，只要使用`gotoPage`就能满足。

那肯定也会有特定的情况，需要显式的指定使用 `navigateTo/switchTab/redirectTo/navigateBack`的哪一个。

那么我们也按照类似的实现，满足相同模式的 API

```javascript
navigateTo('/pages/goods/index', { name: 'jc' }).then(...).catch(...);
switchTab('/pages/goods/index', { name: 'jc' }).then(...).catch(...);
redirectTo('/pages/goods/index', { name: 'jc' }).then(...).catch(...);
navigateBack('/pages/goods/index', { name: 'jc' }).then(...).catch(...);
```

这些函数都可以内聚到同一个模块，我们称其为：**Navigator**

```javascript
const navigator = new Navigator();
navigator.gotoPage(...);
navigator.navigateTo(...);
navigator.switchTab(...);
navigator.redirectTo(...);
navigator.navigateBack(...);
```



模块设计：

![navigator-class](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210321202552.png)



# 3. 虚拟路由策略 — Router 模块

在这里，我们解决：

1. 对外暴露了真实路由，导致历史包袱沉重的问题。

在许多应用开发中，我们经常需要把某种模式匹配到的所有路由，全都映射到同个页面中去。  
例如，我们有一个 Goods 页面，对于所有 ID 各不相同的商品，都要使用这个页面来承载。  

![](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210321202632.png)



那么在代码层面上，期望能实现这样的调用方式：

```javascript
// 创建路由实例
const router = new Router();

// 注册路由
router.register({
  path: '/goods/:id', // 虚拟路由
  route: '/pages/goods/index', // 真实路由
});

// 跳转到 /pages/goods/index，参数: onLoad(options) 的 options = { id: '123' }
router.gotoPage('/goods/123');

// 跳转到 /pages/goods/index，参数: onLoad(options) 的 options = { id: '456' }
router.gotoPage('/goods/456');
```

**Class Router** 的核心逻辑是完成：

1. 路由的注册，完成「虚拟路径」和「真实路径」关系的存储。
2. 满足「虚拟路径」到「真实路径」的转换，并且识别「动态路径参数」（dynamic segment）。
3. 路由跳转。

对于「路由的注册」，我们在其内部存储一个 map 就能完成。

而对于「路径的转换」， `vue-router` 有类似的实现，通过其源码发现，内部是使用  [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 作为路径匹配引擎，我们可以拿来用之。

然后对于「路由的跳转」，我们可以直接复用上面提到的 **Navigator** 模块，通过输入真实路径，来完成路由的跳转。



模块设计：

![route-class](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210321202636.png)



其中：

1. RouteMatcher：提供动态路由参数匹配功能，内部使用  [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 作为路径匹配引擎。
1. Route: 为每个路径创建路由器，存储每个路由的虚拟路径和真实路由的关系。
1. Router：整合内部各模块，对外提供统一且优雅的调用方式。






# 4. 落地中转策略 — LandTransfer 模块

在这里，我们解决：

1. 小程序扫码、公众号链接等场景下的落地页统一。
2. 小程序码，对于无限量API [wxacode.getUnlimited](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html) ，突破参数32位长度限制。



## 4.1. 对于要解决的第一个问题：统一的落地页

我们把如：扫小程序码、公众号菜单、公众号文章等方式打开小程序某个页面的路径称为「外部路由」。

根据小程序的设计，暴露给外部的连接是真实的页面路径，如：`/pages/home/index`，该设计在实践中存在的弊端：**各个落地页分散，后期修改真实文件路径难度大。**

在 **「中长生命周期」** 产品中，随着产品的迭代，我们难免会遇到项目的重构。如果分发出去的都是没经过处理的真实路径的话，我们重构时就会束手束脚，要做很多的兼容操作。因为你不知道，分发出去的小程序二维码， 有多少被打印到实体物料中。

那么，**「虚拟路由」+「落地中转」** 的策略就显得基本且重要了。

「虚拟路由」的功能，**Router **模块给我们提供了支持了，我们还需要对外提供一个统一的落地页面，让它来完成对内部路由的中转。

基本逻辑：

1. 分发出去的真实路由，指向到唯一的落地页面，如：`$LAND_PAGE: /pages/land-page/index`
2. 由这个落地页面，进行内部路由的重定向转发，通过接收 参数，如：`path=/user&name=jc&age=18`

![普通模式](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210309185153.png)

在代码层面上，我们希望能实现这样的使用：

```typescript
// /pages/land-page/index.ts

const landTransfer = new LandTransfer(landTransferOptions);

Page({
  onLoad(options) {
      landTransfer
        .run(options)
        .then(() => {...})
        .catch(() => {...});
  }
});
```

然后针对 TS，我们还可以使用装饰器版本，更加简便：

```typescript
import { landTransferDecorator } from 'wxapp-router';

Page({
  @landTransferDecorator(landTransferOptions)
  onLoad(options) {
    // ...
  },
});
```



## 4.2. 对于第二个要解决的问题：短链参数

微信小程序主要提供了两个接口去生成小程序码：

1. [wxacode.get](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.get.html): 获取小程序码，适用于需要的码数量较少的业务场景。**通过该接口生成的小程序码，永久有效，数量限制为 100,000** 个
2. [wxacode.getUnlimited](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html): 获取小程序码，适用于需要的码数量极多的业务场景。**通过该接口生成的小程序码，永久有效，数量暂无限制。**

第一种方式，`wxacode.get` 数量限制为 10w 个，虽然量很大了，绝大多数的小程序可能用不到这个量。

但如果我们运营的是一个中大型电商小程序的话，假如：1w 种商品 x 10 种商品规格，那就会超过这个数量。到时候再进行改造，就困难了。

所以，如果抱着是运营一个 **「中长生命周期」** 的产品的话，我们会使用第二种方式：`wxacode.getUnlimited`

不尽人意的是，虽然它没有数量限制，但是对参数会有 32 个字符的限制，显然是不够用的（一个 uuid 就 32 字符了）。

对于这种情况，我们可以使用「短链参数」的形式解决，由于[wxacode.getUnlimited](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html) 会通过 `scene`字段作为 query 参数传递给小程序的，那么我们可以通过 `scene`参数来实现短链服务，这需要后端配合。

前后端交互如下：

![Scene短链模式](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210312182826.png)

1. 当小程序需要生成小程序码的时候，请求后端提供的接口，例如：`/api/encodeShortParams`
2. 后端把内容转换为 32 字符内的字符串，存储到数据库中。
3. 后端通过 [wxacode.getUnlimited](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/qr-code/wxacode.getUnlimited.html) 接口，以短链字符串作为 `scene`的值，以商定好的统一落地页 `$LAND_PAGE`作为 `page`值，生成小程序码。
4. 当通过小程序码进入小程序，小程序获取到 `scene`参数，请求后端提供的接口，例如：`/api/decodeShrotParams`
5. 小程序理解内容，跳转到目标页面中去。



而前端对于统一落地页的逻辑处理，我们只需要在第一个问题的基础上，增加一个**转换短链参数内容**的逻辑就行了：

![短链模式](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210309185154.png)



代码层面上，我们我们只需要多定义转换短链参数的方式：`convertScenePrams`

```typescript
// in /pages/land-page/index.js
import { landTransferDecorator } from 'wxapp-router';

const landTransferOptions = {
  // 此处接收 onLoad(options) 中的 options.scene
  convertSceneParams: (sceneParams) => {
    return API.convertScene({ sceneParams }).then((content) => {
      // 假如后端存的是 JSON 字符串，前端decode
      // 要求 content = { path: '/home', a: 1, b:2 }
      return JSON.parse(content);
    });
  },
};

Page({
  @landTransferDecorator(landTransferOptions)
  onLoad(options) {
    // ...
  },
});
```

而其中的 `API.convertScene` 就对接服务端提供 HTTP 接口服务来完成。



## 4.3. LandTransfer 模块设计

![land-transfer](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210321202654.png)



# 5. 更好的开发体验

## 5.1. Typescript + Router

对于小程序内部的路由跳转，我们除了指定一个字符串的路由，我们是否也可以通过链式调用，像调用函数那样去跳转页面呢？类似这样；

```typescript
routes.pages.user.go({ name: 'jc' });
```

这样做的好处是：

1. 更自然的调用方式。
2. 能结合 TS，来做到类型提示和联想。

由于事先 `wxapp-router` 并不知道开发者需要注册的路由是什么样的，所以路由的 TS 声明文件，需要开发者来定义。

例如，我们在项目中维护一份路由文件：

```typescript
// config/routes.ts

// 创建路由实例
const router = new Router();

const routesConfig = [{
  path: '/user',
  route: '/pages/user/index',
}, {
  path: '/goods',
  route: '/pages/goods/index',
}]；

type RoutesType {
  paegs: {
    user: Route<{name: string}>,
    goods: Route,
  }
}

// 注册路由
router.batchRegister(routesConfig);

// 获取 routes
const routes: RoutesType = router.getRoutes();

export default routes;
```

然后在别的地方使用它：

```typescript
import routes from './routes.ts';

routes.pages.user.go({ name: 'jc' });
```



## 5.2. 智能生成路由配置

如果路由变多的时候，我们还需要对每个路由手动去编写 `RoutesType` 的话，就有点难受了。

在小程序中，我们把正式路由都配置到 `app.json` ，那么在遵循既定的项目结构情况下，我们可以通过自动构建，完成大部分工作，例如：

1. 智能注册路由
2. 智能识别页面入参声明



## 5.3. 自定义组件跳转

以上都是脚本层面的使用，小程序中还有 `wxml`, 我们希望能在有个组件快速使用：

```html
<Router path="/pageA" query="{{pageAQuery}}"></Router>
<Router path="/pageB" query="{{pageBQuery}}" type="redirectTo"></Router>
<Router path="/pageC/katy"></Router>
```

那么，实现一个自定义组件，然后把 **Router**模块包装一下，问题就不大了。



示例代码：

```html
// components/router.wxml

<view class="wxapp-router" bind:tap="gotoPage">
    <slot />
</view>
```

```typescript
// components/router.ts

Component({
    properties: {
        path: String,
        type: {
            type: String,
            value: 'gotoPage'
        },
        route: String,
        query: Object,
        delta: Number,
        setData: Object,
    },

    methods: {
        gotoPage(event) {
            const router = getApp().router;
            const { path, route, type, query} = this.data;
            const toPath = route || path;

            if (['gotoPage', 'navigateTo', 'switchTab', 'redirectTo'].includes(type)) {
                (router as any)[type](toPath, query);
            }

            if (type === 'navigateBack') {
                const { delta, setData } = this.data;
                router.navigateBack({ delta }, { setData })
            }
        }
    }
})
```





# 6. 整体架构图

最后，我们来整体回顾一下各模块的设计

![架构设计](https://raw.githubusercontent.com/JerryC8080/figure-bed/master/img/20210321202700.png)

1. Navigator：封装微信原生路由 API，提供智能跳转策略。
1. LandTransfer：提供落地页中转策略。
1. RouteMatcher：提供动态路由参数匹配功能。
1. Route: 为每个路径创建路由器。
1. Router：整合内部各模块，对外提供优雅的调用方式。
1. Logger：内部日志器。
1. Path-to-regexp: 开源社区的路由匹配引擎。



# 7. 最后的最后

鉴于写过很多的实战类的文章，会有不少同学想要到整体的示例代码，这次我就索性写了一个工具，Enjoy it!

[wxapp-router](https://github.com/JerryC8080/wxapp-router)： 🛵 The router for Wechat Miniprogram