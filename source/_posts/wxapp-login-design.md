---
title: 微信小程序登录功能的设计与实现
category: 搬砖码农
date: 2020-10-16 22:22:25
tags: 
- 登录 微信小程序
---


# 一. 前言

对于登录/注册的设计如此精雕细琢的目的，当然是想让这个作为应用的基础能力，有足够的健壮性，避免出现全站性的阻塞。

同时要充分考虑如何解耦和封装，在开展新的小程序的时候，能更快的去复用能力，避免重复采坑。

登录注册这模块，就像个冰山，我们以为它就是「输入账号密码，就完成登录了」，但实际下面还有各种需要考虑的问题。

![](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016104626.jpg)

在此，跟在座的各位分享一下，最近做完一个小程序登录/注册模块之后，沉淀下来的一些设计经验和想法。

# 二. 业务场景

在用户浏览小程序的过程中，由业务需要，往往需要获取用户的一些基本信息，常见的有：

1. 微信昵称
2. 微信手机号

而不同的产品，对于用户的信息要求不尽相同，也会有不一样的授权流程。

第一种，常见于电商系统中，用户购买商品的时候，为了识别用户多平台的账号，往往用手机号去做一个联系，这时候需要用户去授权手机号。

![授权手机号](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016111059.jpg)

第二种，为了让用户信息得到基本的初始化，往往需要更进一步获取用户信息：如微信昵称，`unionId` 等，就需要询问用户授权。

![授权用户信息](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016111042.jpg)

第三种，囊括第一种，第二种。

![完整授权流程](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016111006.jpg)

# 三. 概念

秉着沉淀一套通用的小程序登录方案和服务为目标，我们去分析一下业务，得出变量。

在做技术设计之前，讲点必要的废话，对一些概念进行基本调频。



## 2.1 关于「登录」

登录在英文中是 「login」，对应的还有 「logout」。而登录之前，你需要拥有一个账号，就要 「register」（or sign up）。

话说一开始的产品是没有登录/注册功能的，用的人多了就慢慢有了。出于产品本身的需求，需要对「用户」进行身份识别。

在现实社会中，我们每个人都有一个身份ID：身份证。当我到了16岁的时候，第一次去公安局领身份证的时候，就完成了一次「注册」行为。然后我去网吧上网，身份证刷一下，完成了一次「登录」行为。

那么对于虚拟世界的互联网来说，这个身份证明就是「账号+密码」。

常见的登录/注册方式有：

1. **账号密码注册**

	在互联网的早期，个人邮箱和手机覆盖度小。所以，就需要用户自己想一个账号名，我们注册个QQ号，就是这种形式。

	![from 汽车之家](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016105159.png)	

2. **邮箱地址注册**

	千禧年之后，PC互联网时代快速普及，我们都创建了属于自己的个人邮箱。加上QQ也自带邮箱账号。由于邮箱具有个人私密性，且能够进行信息的沟通，因此，大部分网站开始采用邮箱账号作为用户名来进行注册，并且会在注册的过程中要求登录到相应邮箱内查收激活邮件，验证我们对该注册邮箱的所有权。

	![from 支付宝](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016105005.png)

3. **手机号码注册**

	在互联网普及之后，智能手机与移动互联网发展迅猛。手机也成为每个人必不可少的移动设备，同时移动互联网也已经深深融入每个人的现代生活当中。所以，相较于邮箱，目前手机号码与个人的联系更加紧密，而且越来越多的移动应用出现，采用手机号码作为用户名的注册方式也得到了广泛的使用。   

	![from 知乎](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016105120.png)

到了 2020 年，微信用户规模达 12 亿。那么，微信账号，起码在中国，已成为新一代互联网世界的「身份标识」。

而对微信小程序而言，天然就能知道当前用户的微信账号ID。微信允许小程序应用，能在用户无感知的情况下，悄无声息的「登录」到我们的小程序应用中去，这个就是我们经常称之为的「静默登录」。


其实微信小程序的登录，跟传统 Web 应用的「单点登录」本质是一样的概念。

1. 单点登录：在 A 站登录了，C 站和 B 站能实现快速的「静默登录」。
2. 微信小程序登录：在微信中，登录了微信账号，那么在整个小程序生态中，都可以实现「静默登录」。


由于 Http 本来是无状态的，业界基本对于登录态的一般做法：

1. cookie-session：常用于浏览器应用中
2. access token：常用于移动端等非浏览器应用

在微信小程序来说，对于「JS逻辑层」并不是一个浏览器环境，自然没有 `Cookie`，那么通常会使用 `access token` 的方式。



## 2.2 关于「授权」

对于需要更进一步获取用的用户昵称、用户手机号等信息的产品来说。微信出于用户隐私的考虑，需要用户主动同意授权。小程序应用才能获取到这部分信息，这就有了目前流行的小程序「授权用户信息」、「授权手机号」的交互了。

出于不同的用户信息敏感度不同的考虑，微信小程序对于不同的用户信息提供「授权」的方式不尽相同：

1. 调用具体 API 方式，弹窗授权。
   1. 例如调用 [`wx.getLocation()`](https://developers.weixin.qq.com/miniprogram/dev/api/location/wx.getLocation.html) 的时候，如果用户未授权，则会弹出地址授权界面。
   2. 如果拒绝了，就不会再次弹窗，`wx.getLocation()`直接返回失败。
2. `<button open-type="xxx" />` 方式。
   1. 仅支持：用户敏感信息，用户手机号，需要配合后端进行对称加解密，方能拿到数据。
   2. 用户已拒绝，再次点击按钮，仍然会弹窗。
3. 通过 [`wx.authorize()`](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/authorize/wx.authorize.html)，提前询问授权，之后需要获取相关信息的时候不用再次弹出授权。

# 四. 详细设计

梳理清楚了概念之后，我们模块的划分上，可以拆分为两大块：

1. **登录**：负责与服务端创建起一个会话，这个会话实现静默登录以及相关的容错处理等，模块命名为：`Session`
2. **授权**：负责与用户交互，获取与更新信息，以及权限的控制处理等，模块命名为：`Auth`



## 3.1 登录的实现

### 3.1.1 静默登录

![微信登录](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016111135.png)

微信官方提供的登录方案，总结为三步：

1. 前端通过`wx.login()` 获取一次性加密凭证 code，交给后端。
2. 后端把这个 code 传输给微信服务器端，换取用户唯一标识`openId`和授权凭证`session_key`。（用于后续服务器端和微信服务器的特殊 API 调用，具体看：[微信官方文档-服务端获取开放数据](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html)）。
3. 后端把从微信服务器获取到的用户凭证与自行生成的登录态凭证（token），传输给前端。前端保存起来，下次请求的时候带给后端，就能识别哪个用户。

如果只是实现这个流程的话，挺简单的。

但要实现一个健壮的登录过程，还需要注意更多的边界情况：

1. **收拢`wx.login()`的调用**：

	由于 `wx.login()` 会产生不可预测的副作用，例如会可能导致`session_key`失效，从而导致后续的授权解密场景中的失败。我们这里可以提供一个像`session.login()`的方法，掌握`wx.login()`控制权，对其做一系列的封装和容错处理。

2. **调用的时机**：

	通常我们会在应用启动的时候（ `app.onLaunch()` ），去发起静默登录。但这里会由小程序生命周期设计问题而导致的一个异步问题：加载页面的时候，去调用一个需要登录态的后端 API 的时候，前面异步的静态登录过程有可能还没有完成，从而导致请求失败。

	当然也可以在第一个需要登录态的接口调用的时候以异步阻塞的方式发起登录调用，这个需要结合良好设计的接口层。

	以上讲到的两种场景的详细设计思路下文会讲到。

3. **并发调用的问题**：

	在业务场景中，难免会出现多处代码需要触发登录，如果遇到极端情况，这多处代码同时间发起调用。那就会造成短时间多次发起登录过程，尽管之前的请求还没有完成。针对这种情况，我们可以以第一个调用为阻塞，后续调用等待结果，就像精子和卵子结合的过程。

4. **未过期调用的问题**：

	如果我们的登录态未过期，完全可以正常使用的，默认情况就不需再去发起登录过程了。这时候我们可以默认情况下先去检查登录态是否可用，不能用，我们再发起请求。然后还可以提供一个类似 `session.login({ force: true })`的参数去强行发起登录。



### 3.1.2 静默登录异步状态的处理

**1. 应用启动的时候调用**

因为大部分情况都需要依赖登录态，我们会很自然而然的想到把这个调用的时机放到应用启动的时候（`app.onLaunch()`）来调用。

但是由于原生的小程序启动流程中， `App`，`Page`，`Component` 的生命周期钩子函数，都不支持异步阻塞。

那么我们很容易会遇到 `app.onLaunch` 发起的「登录过程」在 `page.onLoad`的时候还没有完成，我们就无法正确去做一些依赖登录态的操作。

针对这种情况，我们设计了一个状态机的工具：[status](http://beautywejs.com/#/remote/plugin-status?id=plugin-statusl)



![状态机](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016110706.png)



基于状态机，我们就可以编写这样的代码：

```javascript
import { Status } from '@beautywe/plugin-status';

// on app.js
App({
    status: {
       login: new Status('login');
    },

    onLaunch() {
        session
            // 发起静默登录调用
            .login()

            // 把状态机设置为 success
            .then(() => this.status.login.success())
      
            // 把状态机设置为 fail
            .catch(() => this.status.login.fail());
    },
});


// on page.js
Page({
    onLoad() {
      const loginStatus = getApp().status.login;
      
      // must 里面会进行状态的判断，例如登录中就等待，登录成功就直接返回，登录失败抛出等。
      loginStatus().status.login.must(() => {
        // 进行一些需要登录态的操作...
      });
    },
});
```



**2. 在「第一个需要登录态接口」被调用的时候去发起登录**

更进一步，我们会发现，需要登录态的更深层次的节点是在发起的「需要登录态的后端 API 」的时候。

那么我们可以在调用「需要登录态的后端 API」的时候再去发起「静默登录」，对于并发的场景，让其他请求等待一下就好了。

以 [fly.js](https://wendux.github.io/dist/#/doc/flyio/readme) 作为 `wx.request()` 封装的「网络请求层」，做一个简单的例子：

```javascript
// 发起请求，并表明该请求是需要登录态的
fly.post('https://...', params, { needLogin: true });

// 在 fly 拦截器中处理逻辑
fly.interceptors.request.use(async (req)=>{

  // 在请求需要登录态的时候
  if (req.needLogin !== false) {

    // ensureLogin 核心逻辑是：判断是否已登录，如否发起登录调用，如果正在登录，则进入队列等待回调。
    await session.ensureLogin();
    
    // 登录成功后，获取 token，通过 headers 传递给后端。
    const token = await session.getToken();
    Object.assign(req.headers, { [AUTH_KEY_NAME]: token });
  }
  
  return req;
});

```



### 3.1.3 自定义登录态过期的容错处理

当自定义登录态过期的时候，后端需要返回特定的状态码，例如：`AUTH_EXPIRED` 、 `AUTH_INVALID`等。

前端可以在「网络请求层」去监听所有请求的这个状态码，然后发起刷新登录态，再去重放失败的请求：

```javascript
// 添加响应拦截器
fly.interceptors.response.use(
    (response) => {
      const code = res.data;
        
      // 登录态过期或失效
      if ( ['AUTH_EXPIRED', 'AUTH_INVALID'].includes(code) ) {
      
        // 刷新登录态
        await session.refreshLogin();
        
        // 然后重新发起请求
        return fly.request(request);
      }
    }
)
```

那么如果并发的发起多个请求，都返回了登录态失效的状态码，上述代码就会被执行多次。

我们需要对 `session.refreshLogin()` 做一些特殊的容错处理：

1. **请求锁**：同一时间，只允许一个正在过程中的网络请求。
2. **等待队列**：请求被锁定之后，调用该方法的所有调用，都推入一个队列中，等待网络请求完成之后共用返回结果。
3. **熔断机制**：如果短时间内多次调用，则停止响应一段时间，类似于 TCP 慢启动。

示例代码：

```javascript
class Session {
  // ....
  
  // 刷新登录保险丝，最多重复 3 次，然后熔断，5s 后恢复
  refreshLoginFuseLine = REFRESH_LOGIN_FUSELINE_DEFAULT;
  refreshLoginFuseLocked = false;
  refreshLoginFuseRestoreTime = 5000;

  // 熔断控制
  refreshLoginFuse(): Promise<void> {
    if (this.refreshLoginFuseLocked) {
      return Promise.reject('刷新登录-保险丝已熔断，请稍后');
    }
    if (this.refreshLoginFuseLine > 0) {
      this.refreshLoginFuseLine = this.refreshLoginFuseLine - 1;
      return Promise.resolve();
    } else {
      this.refreshLoginFuseLocked = true;
      setTimeout(() => {
        this.refreshLoginFuseLocked = false;
        this.refreshLoginFuseLine = REFRESH_LOGIN_FUSELINE_DEFAULT;
        logger.info('刷新登录-保险丝熔断解除');
      }, this.refreshLoginFuseRestoreTime);
      return Promise.reject('刷新登录-保险丝熔断!!');
    }
  }

  // 并发回调队列
  refreshLoginQueueMaxLength = 100;
  refreshLoginQueue: any[] = [];
  refreshLoginLocked = false;

  // 刷新登录态
  refreshLogin(): Promise<void> {
    return Promise.resolve()
    
      // 回调队列 + 熔断 控制
      .then(() => this.refreshLoginFuse())
      .then(() => {
        if (this.refreshLoginLocked) {
          const maxLength = this.refreshLoginQueueMaxLength;
          if (this.refreshLoginQueue.length >= maxLength) {
            return Promise.reject(`refreshLoginQueue 超出容量：${maxLength}`);
          }
          return new Promise((resolve, reject) => {
            this.refreshLoginQueue.push([resolve, reject]);
          });
        }
        this.refreshLoginLocked = true;
      })

      // 通过前置控制之后，发起登录过程
      .then(() => {
        this.clearSession();
        wx.showLoading({ title: '刷新登录态中', mask: true });
        return this.login()
          .then(() => {
            wx.hideLoading();
            wx.showToast({ icon: 'none', title: '登录成功' });
            this.refreshLoginQueue.forEach(([resolve]) => resolve());
            this.refreshLoginLocked = false;
          })
          .catch(err => {
            wx.hideLoading();
            wx.showToast({ icon: 'none', title: '登录失败' });
            this.refreshLoginQueue.forEach(([, reject]) => reject());
            this.refreshLoginLocked = false;
            throw err;
          });
      });

  // ...
}
```

### 3.1.4 微信 session_key 过期的容错处理

我们从上面的「静默登录」之后，微信服务器端会下发一个`session_key`给后端，而这个会在需要获取[微信开放数据](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html)的时候会用到。

![微信开放数据](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016110824.png)



而 `session_key` 是有时效性的，以下摘自微信官方描述：

> #### 会话密钥 session_key 有效性
>
> 开发者如果遇到因为 session_key 不正确而校验签名失败或解密失败，请关注下面几个与 session_key 有关的注意事项。
>
> 1. [wx.login](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html) 调用时，用户的 session_key **可能**会被更新而致使旧 session_key 失效（刷新机制存在最短周期，如果同一个用户短时间内多次调用 [wx.login](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)，并非每次调用都导致 session_key 刷新）。开发者应该在明确需要重新登录时才调用 [wx.login](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.login.html)，及时通过 [auth.code2Session](https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/auth.code2Session.html) 接口更新服务器存储的 session_key。
> 2. 微信不会把 session_key 的有效期告知开发者。我们会根据用户使用小程序的行为对 session_key 进行续期。用户越频繁使用小程序，session_key 有效期越长。
> 3. 开发者在 session_key 失效时，可以通过重新执行登录流程获取有效的 session_key。使用接口 [wx.checkSession](https://developers.weixin.qq.com/miniprogram/dev/api/open-api/login/wx.checkSession.html)可以校验 session_key 是否有效，从而避免小程序反复执行登录流程。
> 4. 当开发者在实现自定义登录态时，可以考虑以 session_key 有效期作为自身登录态有效期，也可以实现自定义的时效性策略。

翻译成简单的两句话：

1. `session_key` 时效性由微信控制，开发者不可预测。
2. `wx.login`可能会导致`session_key`过期，可以在使用接口之前用`wx.checkSession`检查一下。

而对于第二点，我们通过实验发现，偶发性的在 `session_key` 已过期的情况下，`wx.checkSession` 会概率性返回 `true`

社区也有相关的反馈未得到解决：

* [小程序解密手机号,隔一小段时间后,checksession:ok,但是解密失败](https://developers.weixin.qq.com/community/develop/doc/000424005b89983f337a622c751000?highLine=wx.checkSession)
* [wx.checkSession有效，但是解密数据失败](https://developers.weixin.qq.com/community/develop/doc/0008e429bd0c886e10699f59c51000?_at=1602745291452)
* [checkSession判断session_key未失效，但是解密手机号失败](https://developers.weixin.qq.com/community/develop/doc/000a04ab4546d80d5428ffcee51800?_at=1602745291452)

**所以结论是：`wx.checkSession`可靠性是不达 100% 的。**



基于以上，我们需要对 `session_key` 的过期做一些容错处理：

1. 发起需要使用 `session_key` 的请求前，做一次 `wx.checkSession` 操作，如果失败了刷新登录态。
2. 后端使用`session_key`解密开放数据失败之后，返回特定错误码（如：`DECRYPT_WX_OPEN_DATA_FAIL`），前端刷新登录态。

示例代码：

```javascript
// 定义检查 session_key 有效性的操作
const ensureSessionKey = async () => {
  const hasSession = await new Promise(resolve => {
    wx.checkSession({
      success: () => resolve(true),
      fail: () => resolve(false),
    });
  });
  
  if (!hasSession) {
    logger.info('sessionKey 已过期，刷新登录态');

    // 接上面提到的刷新登录逻辑
    return session.refreshLogin();
  }

  return Promise.resolve();
}

// 在发起请求的时候，先做一次确保 session_key 最新的操作（以 fly.js 作为网络请求层为例）
const updatePhone = async (params) => {
  await ensureSessionKey();
  const res = await fly.post('https://xxx', params);
}

// 添加响应拦截器, 监听网络请求返回
fly.interceptors.response.use(
    (response) => {
      const code = res.data;
        
      // 登录态过期或失效
      if ( ['DECRYPT_WX_OPEN_DATA_FAIL'].includes(code)) {

        // 刷新登录态
        await session.refreshLogin();
        
        // 由于加密场景的加密数据由用户点击产生，session_key 可能已经更改，需要用户重新点击一遍。
        wx.showToast({ title: '网络出小差了，请稍后重试', icon: 'none' });
      }
    }
)
```



## 3.2 授权的实现

### 3.2.1 组件拆分与设计

在用户信息和手机号获取的方式上，微信是以 `<button open-type='xxx' />` 的方式，让用户主动点击授权的。

那么为了让代码更解耦，我们设计这样三个组件：

1. `<user-contaienr getUserInfo="onUserInfoAuth">`: 包装点击交互，通过 `<slot>` 支持点击区域的自定义UI。
2. `<phone-container getPhonenNmber="onPhoneAuth">` : 与 `<user-container>` 同理。
3. `<auth-flow>`: 根据业务需要，组合 `<user-container>`、`<phone-container>` 组合来定义不同的授权流程。



以开头的业务场景的流程为例，它有这样的要求：

1. 有多个步骤。
2. 如果中途断掉了，可以从中间接上。
3. 有些场景中，只要求达到「用户信息授权」，而不需要完成「用户手机号」。

![完整授权流程](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016111006.jpg)

那么授权的阶段可以分三层：

```javascript
// 用户登录的阶段
export enum AuthStep {
  // 阶段一：只有登录态，没有用户信息，没有手机号
  ONE = 1,

  // 阶段二：有用户信息，没有手机号
  TWO = 2,

  // 阶段三：有用户信息，有手机号
  THREE = 3,
}
```

`AuthStep` 的推进过程是不可逆的，我们可以定义一个 `nextStep` 函数来封装 AuthStep 更新的逻辑。外部使用的话，只要无脑调用 `nextStep`方法，等待回调结果就行。

示例伪代码：

```javascript
// auth-flow component

Component({
  // ...
  
  data: {
    // 默认情况下，只需要到达阶段二。
    mustAuthStep: AuthStep.TWO
  },
  
  // 允许临时更改组件的需要达到的阶段。
  setMustAuthStep(mustAuthStep: AuthStep) {
    this.setData({ mustAuthStep });
  },
  
  // 根据用户当前的信息，计算用户处在授权的阶段
  getAuthStep() {
    let currAuthStep;
    
    // 没有用户信息，尚在第一步
    if (!session.hasUser() || !session.hasUnionId()) {
      currAuthStep = AuthStepType.ONE;
    }

    // 没有手机号，尚在第二步
    if (!session.hasPhone()) {
      currAuthStep = AuthStepType.TWO;
    }

    // 都有，尚在第三步
    currAuthStep = AuthStepType.THREE;
    return currAuthStep;
  }
  
  // 发起下一步授权，如果都已经完成，就直接返回成功。
  nextStep(e) {
    const { mustAuthStep } = this.data;
    const currAuthStep = this.updateAuthStep();
  
    // 已完成授权
    if (currAuthStep >= mustAuthStep || currAuthStep === AuthStepType.THREE) {
      // 更新全局的授权状态机，广播消息给订阅者。
      return getApp().status.auth.success();
    }

    // 第一步：更新用户信息
    if (currAuthStep === AuthStepType.ONE) {
      // 已有密文信息，更新用户信息
      if (e) session.updateUser(e);

      // 更新到视图层，展示对应UI，等待获取用户信息
      else this.setData({ currAuthStep });
      return;
    }

    // 第二步：更新手机信息
    if (currAuthStep === AuthStepType.TWO) {
      // 已有密文信息，更新手机号
      if (e) this.bindPhone(e);

      // 未有密文信息，弹出获取窗口
      else this.setData({ currAuthStep });
      return;
    }

    console.warn('auth.nextStep 错误', { currAuthStep, mustAuthStep });
  },
  
  // ...
});
```

那么我们的 `<auth-flow>` 中就可以根据 `currAuthStep `和 `mustAuthStep`来去做不同的 UI 展示。需要注意的是使用 `<user-container>`、`<phone-container>` 的时候连接上 `nextStep(e)` 函数。

示例伪代码：

```html
<view class="auth-flow">

  <!-- 已完成授权 -->
  <block wx:if="{{currAuthStep === mustAuthStep || currAuthStep === AuthStep.THREE}}">
    <view>已完成授权</view>
  </block>

  <!-- 未完成授权，第一步：授权用户信息 -->
  <block wx:elif="{{currAuthStep === AuthStep.ONE}}">
    <user-container bind:getuserinfo="nextStep">
      <view>授权用户信息</view>
    </user-container>
  </block>

  <!-- 未完成授权，第二步：授权手机号 -->
  <block wx:elif="{{currAuthStep === AuthStep.TWO}}">
    <phone-container bind:getphonenumber="nextStep">
      <view>授权手机号</view>
    </phone-container>
  </block>
  
</view>
```



### 3.2.2 权限拦截的处理

到这里，我们制作好了用来承载授权流程的组件 `<auth-flow>`，那么接下来就是决定要使用它的时机了。

我们梳理需要授权的场景：

1. 点击某个按钮，例如：购买某个商品。

   对于这种场景，常见的是通过弹窗完成授权，用户可以选择关闭。

   

   ![授权模型-弹窗](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016113312.png)

2. 浏览某个页面，例如：访问个人中心。

   对于这种场景，我们可以在点击跳转某个页面的时候，进行拦截，弹窗处理。但这样的缺点是，跳转到目标页面的地方可能会很多，每个都拦截，难免会错漏。而且当目标页面作为「小程序落地页面」的时候，就避免不了。

   这时候，我们可以通过重定向到授权页面来完成授权流程，完成之后，再回来。

   
   
   ![授权模型-页面](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016113324.png)

那么我们定义一个枚举变量：

```javascript
// 授权的展示形式
export enum AuthDisplayMode {
  // 以弹窗形式
  POPUP = 'button',

  // 以页面形式
	PAGE = 'page',
}
```

我们可以设计一个 `mustAuth` 方法，在点击某个按钮，或者页面加载的时候，进行授权控制。

伪代码示例：

```javascript
class Session {
  // ...
  
  mustAuth({
    mustAuthStep = AuthStepType.TWO, // 需要授权的LEVEL，默认需要获取用户资料
    popupCompName = 'auth-popup',	// 授权弹窗组件的 id
    mode = AuthDisplayMode.POPUP, // 默认以弹窗模式
  } = {}): Promise<void> {
    
    // 如果当前的授权步骤已经达标，则返回成功
    if (this.currentAuthStep() >= mustAuthStep) return Promise.resolve();

    // 尝试获取当前页面的 <auth-popup id="auth-popup" /> 组件实例
    const pages = getCurrentPages();
    const curPage = pages[pages.length - 1];
    const popupComp = curPage.selectComponent(`#${popupCompName}`);

    // 组件不存在或者显示指定页面，跳转到授权页面
    if (!popupComp || mode === AuthDisplayMode.PAGE) {
      const curRoute = curPage.route;

      // 跳转到授权页面，带上当前页面路由，授权完成之后，回到当前页面。
      wx.redirectTo({ url: `authPage?backTo=${encodeURIComponent(curRoute)}` });
      return Promise.resolve();
    }
    
    // 设置授权 LEVEL，然后调用 <auth-popup> 的 nextStep 方法，进行进一步的授权。
    popupComp.setMustAuthStep(mustAuthStep);
    popupComp.nextStep();

    // 等待成功回调或者失败回调
    return new Promise((resolve, reject) => {
      const authStatus = getApp().status.auth;
      authStatus.onceSuccess(resolve);
      authStatus.onceFail(reject);
    });
  }
  
  // ...
}
```

那么我们就能在按钮点击，或者页面加载的时候进行授权拦截：

```javascript
Page({
  onLoad() {
    session.mustAuth().then(() => {
      // 开始初始化页面...
    })；
  }
  
  onClick(e) {
    session.mustAuth().then(() => {
      // 开始处理回调逻辑...
    })；
  }
})
```

当然，如果项目使用了 TS 的话，或者支持 ES7 Decorator 特性的话，我们可以为 `mustAuth` 提供一个装饰器版本：

```javascript
export function mustAuth(option = {}) {
  return function(
    _target,
    _propertyName,
    descriptor,
  ) {
    // 劫持目标方法
    const method = descriptor.value;
    
    // 重写目标方法
    descriptor.value = function(...args: any[]) {
      return session.mustAuth(option).then(() => {
        // 登录完成之后，重放原来方法
        if (method) return method.apply(this, args);
      });
    };
  };
}
```

那么使用方式就简单一些了：

```javascript
Page({
  @mustAuth();
  onLoad() {
    // 开始初始化页面...
  }
  
  @mustAuth();
  onClick(e) {
    // 开始处理回调逻辑...
  }
});
```



## 3.3. 前后端交互协议整理

作为一套可复用的小程序登录方案，当然需要去定义好前后端的交互协议。

那么整套登录流程下来，需要的接口有这么几个：

![登录注册前后端接口协议](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/20201016162606.png)

1. **静默登录 silentLogin**
  
   1. 入参：
      1. code: 产自 wx.login()
   2. 出参：
      1. token: 自定义登录态凭证
      2. userInfo: 用户信息
   3. 说明：
      1. 后端利用 code 跟微信客户端换取用户标识，然后注册并登录用户，返回自定义登录态 `token` 给前端
      2. `token` 前端会存起来，每个请求都会带上
      3. userInfo 需要包含`nickname`和`phone`字段，前端用于计算当前用户的授权阶段。当然这个状态的记录可以放在后端，但是我们认为放在前端，会更加灵活。
2. **更新用户信息 updateUser**
   1. 入参：
      1. nickname: 用户昵称
      2. encrypt: 微信开放数据相关的 `iv`, `encryptedData`
      3. 以及其他如性别地址等非必要字段
   2. 出参：
      1. userInfo：更新后的最新用户信息
   3. 说明：
      1. 后端解密微信开放数据，获取隐蔽数据，如：`unionId `等
      2. 后端支持更新包括 `nickname`等用户基本信息。
      3. 前端会把 userInfo 信息更新到 `session` 中，用于计算授权阶段。
3. **更新用户手机号 updatePhone**
   1. 入参：
      1. encrypt：微信开放数据相关的 `iv`, `encryptedData`
   2. 出参：
      1. userInfo：更新后的最新用户信息
   3. 说明：
      1. 后端解密开放式局，获取手机号，并更新到用户信息中。 
      2. 前端会把 userInfo 信息更新到 `session` 中，用于计算授权阶段。
4. **解绑手机号 unbindPhone**
   1. 入参：-
   2. 出参：-
   3. 说明：后端解绑用户手机号，成功与否，走业务定义的前后端协议。
5. **登录 logout**
   1. 入参：-
   2. 出参：-
   3. 说明：后端主动过期登录态，成功与否，走业务定义的前后端协议。
   
   

# 五. 架构图

最后我们来梳理一下整体的「登录服务」的架构图：

![微信小程序登录服务架构图](https://tva1.sinaimg.cn/large/007S8ZIlgy1gjqk8sm9dbj30v60fp0uc.jpg)

由「登录服务」和「底层建设」组合提供的通用服务，业务层只需要去根据产品需求，定制授权的流程`<auth-flow>`，就能满足大部分场景了。

# 六. 总结

本篇文章通过一些常见的登录授权场景来展开来描述细节点。

整理了「登录」、「授权」的概念。

然后分别针对「登录」介绍了一些关键的技术实现：

1. 静默登录
2. 静默登录异步状态的处理
3. 自定义登录态过期的容错处理
4. 微信`session_key`过期的容错处理

而对于「授权」，会有设计UI部分的逻辑，还需要涉及到组件的拆分：

1. 组件拆分与设计
2. 权限拦截的处理

然后，梳理了这套登录授权方案所依赖的后端接口，和给出最简单的参考协议。

最后，站在「秉着沉淀一套通用的小程序登录方案和服务为目标」的角度，梳理了一下架构层面上的分层。

1. 业务定制层
2. 登录服务层
3. 底层建设

# 七. 参考

1. [fly.js 官网](https://wendux.github.io/dist/#/doc/flyio/readme)
2. [微信官方文档-授权](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/authorize.html)
3. [微信官方文档-服务端获取开放数据](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html)
4. 微信官方社区
   1. [小程序解密手机号,隔一小段时间后,checksession:ok,但是解密失败](https://developers.weixin.qq.com/community/develop/doc/000424005b89983f337a622c751000?highLine=wx.checkSession)
   2. [wx.checkSession有效，但是解密数据失败](https://developers.weixin.qq.com/community/develop/doc/0008e429bd0c886e10699f59c51000?_at=1602745291452)
   3. [checkSession判断session_key未失效，但是解密手机号失败](https://developers.weixin.qq.com/community/develop/doc/000a04ab4546d80d5428ffcee51800?_at=1602745291452)

