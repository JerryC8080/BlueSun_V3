---
title: ServiceWorker 缓存与 HTTP 缓存
category: 搬砖码农
date: 2022-04-21 01:43:04
tags: 
- PWA
---

虽然 ServiceWorker 和 PWA 正在成为现代 Web 应用程序的标准，但浏览器资源缓存变得比以往任何时候都复杂。    
本文涵盖了浏览器缓存的重点内容，具体包括：
1. ServiceWorker 缓存与 HTTP 缓存的优先级？
2. 主流浏览器实现的 MemoryCache 和 DiskCache 在哪一层？
3. MemoryCache、DiskCache、ServiceWorker 缓存哪个速度更快？

## 缓存流程概述

我们先来看标准定义的资源请求遵循的顺序：

![缓存流](https://web-dev.imgix.net/image/admin/vtKWC9Bg9dAMzoFKTeAM.png?auto=format)

1. **ServiceWorker 缓存**：ServiceWorker 检查资源是否存在其缓存中，并根据其编程的缓存策略决定是否返回资源。这个操作不会自动发生，需要在注册的 ServiceWorker 中定义 `fetch` 事件去拦截并处理网络请求，这样才能命中 ServiceWorker 缓存而不是网络或者 HTTP 缓存。
2. **HTTP 缓存**：这里就是我们常常说的「强缓存」和「协商缓存」，如果 HTTP 缓存未过期的话，浏览器就会使用 HTTP 缓存的资源。
3. **服务器端**：如果 ServiceWorker 缓存或者 HTTP 缓存中未找到任何资源，则浏览器会向网络请求资源。这里就会涉及到 CDN 服务或者源服务的工作了。

这是标准定义的资源请求流程，但是有追求的浏览器还会在 ServiceWorker 上面加一层 **「内存缓存层」** ，以 Chrome 为例，我们请求一个资源，除去网络，会有三种浏览器缓存返回：

![image-20220420193610795](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/202204201936867.png)

**那么 MemoryCache 和 DiskCache 与 ServiceWorker Cache 的优先级是怎么样的呢？**    
下面我们讲讲三者的区别。

## MemoryCache、DiskCache 在缓存流程的哪一层？

我们以 Chrome 为例，MemoryCache 作为第一公民，位于 ServiceWorker 之上。    
也就是命中了 MemoryCache，就不会触发 ServiceWorker 的 fetch 事件。    
而 DiskCache 则位于原来的 HTTP 缓存层：

![http-cache-priority.drawio](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421014504.png)

MemoryCache 的存在会导致一个问题： **ServiceWorker 并不总是对资源有着控制权。**
这会另我们本来期望的情况会变得复杂且不可预知。可惜的是 MemoryCache 并不在 W3C 的标准中，W3C 从 2016 年到现在仍然在讨论着这个事情，看来短时间这个问题是得不到解决了。

> 一些正在讨论的话题：
>
> 1. [safari fetches from memory cache instead of Service worker ](https://github.com/w3c/ServiceWorker/issues/1510)
> 2. [Difference between disk and memory cache](https://github.com/w3c/ServiceWorker/issues/1174)
> 3. [Advanced Questions About Service Worker](https://github.com/jakearchibald/idb/issues/171)
> 4. [allow service worker produced resources to be marked as "cachable"](https://github.com/w3c/ServiceWorker/issues/962)

**我们真的没有办法么？**

要是我们遇到业务场景，确实对 ServiceWorker 资源控制权有很强的的要求，我们还是可以做点事情的。    
MemoryCache 是受控于 **「强缓存」** 的，这意味着我们可以在 ServiceWorker 拦截资源的响应，并设置资源响应头来使资源从 MemoryCache 失效：

```
cache-control: max-age=0
```

```typescript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async function () {
      // 从 HTTP 缓存或者网络获取资源
      const res =  fetch(event.request);
      
      // 因为 Response 是一个流，只能用一次，所以这里要 clone 一下。
      const newRes = res.clone();
      
      // 改写资源响应头
			return new Response(res.body, { ...newRes, headers: {
        'cache-control': 'max-age=0'
      }});
    })();
  );
});
```

需要注意的是，这种方法是以牺牲少量加载性能为前提的。这取决于我们实际场景中是性能优先，还是离线优先，或者其他什么情况优先。

## MemoryCache、DiskCache、ServiceWorker 缓存哪个速度更快？

![image-20220420203359745](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/img/202204202034325.png)

我们再看一下同一个资源三种缓存的加载速度和优先级：
1. 加载速度：MemoryCache > **DiskCache > ServiceWorker**
2. 优先级：MemoryCache > **ServiceWorker> DiskCache**

MemoryCache 优先级在 ServiceWorker 前面，这个没问题。    
**但是速度更慢的 ServiceWorker 优先级比速度更快的 DiskCache 更高？**    
**那盘下来，ServiceWorker 岂不是减慢了站点的加载速度？**

## 对照实验

为了研究这个问题，我做了一组对照实验。    
实验只在 Chrome 进行，chrome devtool 为每个资源提供时间。所有加载资源的信息都可以作为 HAR 文件下载下来，然后编写本地脚本进行信息提取和分析。

![image-20220421001201494](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421001210.png)

**实验条件**

1. 同一个环境：Chrome97 / MacOS 10.14 / Wifi
2. 同一张图片的多次并发加载：
   1. 3 张 133KB 图片 10 次实验
   2. 10 张 133KB 图片 10 次实验
   3. 100 张 133KB 图片 10 次实验
3. 观察两个性能：
   1. DiskCache 缓存性能表现
   2. ServiceWorker 缓存速度表现

### 实验一：3 张 133KB 图片并发

![image-20220421013805667](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421013900.png)

首先是并发请求 3 张图片进行 10 次实验，取平均数据，然后分别观察 DiskCache、ServiceWorker Cache 的性能表现。

观察：
1. DiskCache：我们发现下载操作并没有花太多时间，但是资源在等待排队。
2. ServiceWorker Cache：更多耗时在下载。

结论：但尽管如此，这种情况下， **DiskCache 依然是比 ServiceWorker Cache 更快。**



### 实验二：3 张 133KB 图片 10 次实验

![image-20220421013924399](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421013928.png)

当我把并发图片增加到 10 张，这种情况可能会更加接近于实际情况，站点中可能会拥有更多的不同的资源（JS文件、字体、样式、图像等），因为某些网站可能会在一个页面存在超过 10 个资源。

观察：
1. DiskCache：从第二个资源开始排队时间依然很长，但是下载时间是基本不变的。
2. ServiceWorker Cache： 排队并不是问题，但等待是。

结论：这种情况下， **DiskCache 会略逊于 ServiceWorker Cache。**



### 实验三：3 张 133KB 图片 100 次实验

![image-20220421014006376](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421014007.png)

当我把并发图片增加到 100 张，这种情况几乎是不真实的情况，但是我好奇为什么 DiskCache 为什么在第一次试验中比 ServiceWorker Cache 更快。

观察：
1. DiskCache：排队依然是问题，且随着并发数成线性上升。我们甚至能看到浏览器是如何加载图片的，一次并发大概 6 张图片。
2. ServiceWorker Cache：虽然等待时间随着并发数上升，但是是平缓的。

结论： **大并发下 ServiceWorker Cache 比 DiskCache 更快。**


那 DiskCache 和 ServiceWorker 怎么选择？
**小孩子才做选择，大人都要**

由于 ServiceWorker 的优先级在 DiskCache 之上，我们可以在 ServiceWorker 进行 **「资源竞速」**，同一时间请求 ServiceWorker Cache 和 DiskCache，哪个先返回就把资源返回上一层。代码可能是这样的：

```typescript
self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async function () {
      const res = Promise.race([
        // 请求 ServiceWorker Cache
        cache.open(CACHE_NAME).then(cache => cache.match(event.request)),
        // 请求 DiskCache 或者网络资源
        fetch(event.request)
      ])
    })();
  );
});
```



### 实验四：资源竞速之后，并发请求 3 张图片、10 张图片 和 100 张图片

当我们进行资源竞速之后，这种情况下，无论是并发少量资源还是大量资源，都能达到最快的级别。

![image-20220421014045092](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421014505.png)
![image-20220421005715401](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/jerryc/20220421005723.png)

# 总结

本篇我们搞懂了 ServiceCache、MemoryCache、DiskCache 的优先级。    
然后深入对比了 ServiceWorker Cache 和 DiskCache 的性能表现。    
在少量资源并发的时候，DiskCache 更快，在大量资源并发的时候，ServiceWorker 更快。    
最后通过「资源竞速」的方式来兼顾两种情况。    
但是，在某些时候，我们比较 ServiceWorker 和 HTTP 缓存有点不公平。    
ServiceWorker 的用途会更加广泛，它提供了更细力度的缓存控制、使离线化应用得以实现、并且对比主线程，他能够使用更多的 CacheAPI 容量。


