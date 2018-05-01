---
title: 「译」JavaScript框架的探索与变迁
category: 搬砖码农
date: 2017-11-01 22:22:25
tags: 
- javascript
---

## 译者言

近几年可谓是 JavaScript 的大爆炸纪元，各种框架类库层出不穷，它们给前端带来一个又一个的新思想。从以前我们用的 jQuery 直接操作 DOM，到 BackboneJS、Dojo 提供监听器的形式，在到 Ember.js、AngularJS 数据绑定的理念，再到现在的 React、Vue 虚拟 DOM 的思想。都是在当前 Web 应用日益复杂的时代，对于如何处理「应用状态」与「用户界面」之间如何更新的问题，带来更先进的解决方案。

本文是一篇从技术上，以数据变更和UI同步为方向，循序渐进的讲述 JavaScript 框架如何演进过来的。

本篇文章，给了我一个更加高纬度的视角，来看待 JavaScript 这些个框架。


## 正文

在 2015 年，JavaScript 框架的选择并不少。在 Angular，Ember，React，Backbone 以及它们众多的竞争者中，有足够多的选择。

虽然可以通过不少方面来对比这些框架的不同，但是最让人感兴趣的是它们分别如何管理状态（state）的。特别的，通过思考这些框架分别如何处理状态变化是很有用的。它们都提供了什么样的工具让你把这些变化呈现给用户？ 

如何处理应用状态（app state）与用户界面（user interface）之间的同步，长期以来都是用户界面开发如此复杂的主要原因。现在，我们有几个不同的处理方案。本文探索以下：Ember 的数据绑定，Angular 的脏检查、React 的虚拟DOM以及它与不可变数据结构（immutable data structures）之间的联系。

## 数据映射 Projecting Data

我们首先讨论程序内部的状态与屏幕所看到的内容之间的映射。你把各种诸如 object，arrays，strings，以及 numbers 转换成一颗由诸如 texts、forms、links、buttons 和 images 组成的树状结构。在 Web 中，前者通常指 JavaScript 中的数据结构，而后者指的是 [DOM （Document Object Model）](https://www.w3.org/DOM/)

我们经常称这个过程为渲染（rendering），你可以想象这个过程是从数据模型到用户界面的一个映射。当你把数据渲染成一个模板，你得到的是一个 DOM（或者说 HTML）。

![onchange_base.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/15B722FCBCB7A5D72D240DC5B55F7DDE.svg)

这个过程本身已经足够简单了，数据模型到用户界面之间的映射，并不总是那么的琐碎。它基本只是一个接受输入然后直接输出的函数。

在我们需要考虑数据开始随着时间而变化的时候，这件事就变得更有挑战性了。当用户进行操作或者其它某些操作导致数据产生变化的时候，用户界面需要呈现出这些变化。而且，由于重新构建 DOM 树的代价是极其昂贵的，我们要尽可能产生小的影响。

![onchange_change.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/1D6EF2506F41A57871712CBCAD1463F8.svg)

因为状态产生了变化，这比只是一次性渲染用户界面变得更加难。这就到了以下解决方案开始表演的时候了。



## 服务器渲染 Server-Side Rendering

> 宇宙是永恒不变的，没有任何变化

在 JavaScript 新纪元之前，你的 Web 应用的任何交互都会触发一趟服务器的环绕旅行。每一个点击和每一个表单提交都会卸载当前页面，一个请求发送到服务器，服务器响应一个新的页面，然后浏览器重新渲染。

![onchange_reload.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_reload.svg)

这种方式不需要前端管理任何的状态（state）。就前端范畴而言，当一些事情发生了(后端返回的数据)，整个过程就结束了。就算有状态，那也只是后端的范畴。前端只是由 HTML 和 CSS 构成，也许有时候会有些 JavaScript 撒在表面调味。

从前端来说，这是一个很简单的实现方式，但也是一个很慢的方式。每一个交互并不仅仅触发UI的重渲染，还涉及服务器的数据查询以及服务端渲染。

大多数人已经不再这样做了，我们可以在服务器端初始化我们的应用，然后转移到前端来做状态的管理（这也是 [isomorphic JavaScript](http://isomorphic.net/) 致力于的。）。已经有人在类似的[更复杂的设计思想](https://signalvnoise.com/posts/3112-how-basecamp-next-got-to-be-so-damn-fast-without-using-much-client-side-ui)中取得成功。



## JS第一代革命：手动重渲染

> 我不知道哪些需要渲染的，你来告诉我。

第一代革命的 JavaScript 框架，如：Backbone.js, Ext JS 以及 Dojo。第一次在浏览器端引入了数据模型（Data Model）的概念，代替了以前那些直接操作 DOM 的轻量级的脚本代码。这意味着你终于可以在浏览器端管理状态了。当数据模型的上下文改变时，你需要做一些工作，让改变呈现在用户界面中。

这些框架的体系能分离你的模型和界面代码，但同时也留下了一大部分同步的工作给你。你可以监听某类事件的发生，但是你有义务去计算如何重新渲染以及如何落实到用户界面中。

![onchange_manual.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_manual.svg)

基于这种模型，作为开发者，你需要考虑大量的性能问题。由于你能控制什么时候和怎么处理更新，你可以从中做任意的做一些调整。这经常会面临一些权衡：简单的处理导致大面积的页面更新，或者强性能的处理来更新一小块页面。

## Ember.js: 数据绑定

> 由于我在控制你的模型和试图，我会确切知道如何重新渲染。

当应用状态改变的时候，手动处理渲染工作，无可避免的增加了复杂度。很多框架旨在解决这个问题，[Ember.js](https://emberjs.com) 就是其中之一。

Ember，像 Backbone 一样，当数据模型改变的时候会触发某个事件。不同之处在于 Ember 同时提供了一些方法来接收这些事件。你可以把 UI 绑定到数据模型中，这意味着有一个监听器绑定到了 UI 上。该监听器当收到事件的时候，知道如何更新 UI。

![onchange_kvo.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_kvo.svg)

这是一个高效率的机制。尽管设置全部的监听器需要在初始化时多出一些工作，但是之后就能保证同步状态时的最小影响。当状态产生变化时， 只有真正需要更新的部分才会发生改变。

这种方式最大的牺牲是 Ember 需要时刻盯着数据模型。这意味着你需要通过 Ember 的 API 封装你的数据，以及你要更新数据的时候是使用 `foo.set('x',42)` 而不是 `foo.x = 42`，以此类推。

在未来 ES6 的 Proxies 可能会对这种模式产生一定的帮助。它让 Ember 可以通过装饰 object 来绑定那些监听器的代码。这就不用像传统方式那样重写 object 的 setter 方法了。



## AngularJS：脏检查

> 我不知道什么更新了，所以当更新的时候，我只能检查所有的东西。

AngularJS 类似于 Ember，当状态改变的时候，必须人工去处理。但不同的是，AngularJS 从不同的角度来解决问题。

当你在 Angular 模板中引用你的数据，例如这样的语句 `{{foo.x}}` ，Angular 不仅仅只是渲染数据，而且会这个特定的数据创建一个观察者。如此，只要你的应用中发生任何变化，Angular 都会检查这个观察者检视着的数据是否发生了改变。如果发生了改变，就会重新渲染这个数据对应的用户界面。这个过程称作脏检查（Dirty Checking）。



![onchange_watch.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_watch.svg)



这种监听改变的风格最大的好处就是，你可以在你的数据模型中使用任何姿势。Angular 对此没有任何限制，它不关心这个。没有基础的对象需要扩展，也没有 API 需要调用。

但坏处就是现在数据模型没有任何内建的检测手段告诉告诉框架哪些东西发生了改变，框架对是否或者哪里发生了改变没有任何洞察力。这意味着数据模型需要通过外部来监听改变，而 Angular 就是这样子做的：所有观察者在任何时间发生的任何改变，都需要被执行一次。点击事件，HTTP 响应，timeout 方法的触发，对于这些，观察者都需要执行一遍。

经常去执行所有观察者，这听起来像是性能的噩梦，但是它令人惊讶的快。这主要是因为在检查到任何改变之前，没有 DOM 的操作过程，而原生的 JavaScript 引用对象的检查平均消耗的性能是廉价的。但是当你要处理大量的 UI 或者经常性触发重新渲染，那么额外的性能优化手段就变得很有必要了。

Ember 和 Angular 都即将得益于即将到来的标准：ECMAScript7 的 [Object.observe](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/observe) 功能，很适合 Angular。它提供了原生的 API 给你用来监听对象属性的变化。尽管这样，Angular 不需要支持所有的用例，因为 Angular 的观察者相对于简单的监听对象属性，可以做到的更好。

即将到来的 Angular 2 在检测改变这件事上带来了很多有趣的更新，最近 [Victor Savkin 的一篇文章](http://victorsavkin.com/post/110170125256/change-detection-in-angular-2)有介绍到。

关于这个主题，也可以看：[Victor's ng-conf talk](https://www.youtube.com/watch?v=jvKGQSFQf10&feature=youtu.be)

## React: 虚拟 DOM

> 我不知道到底哪些发生了变化，所以我只能重新渲染所有东西，然后看一下有哪些不同。

React 有很多有趣的特性，但是我们讨论的最有趣的特性是虚拟 DOM。

像 Angular 一样，React 不会对数据模型进行限制，而是让你使用你认为合适的任何对象和数据结构。那么，它是如何在存在改变的情况下使 UI 保持最新呢？

React 所做的是有效的把我们带回服务器渲染时代，当时我们还不关心状态变化：每当某处发生改变的时候，它会从头重新渲染整个 UI。这可以显著的简化 UI 的代码。大部分情况，你不会关心如何在 React 中维护状态。就像服务器渲染一样，渲染一次就算了。当组件需要变更时，它只能再次重新渲染。组价的初始化渲染和更细它的数据之间，没有任何区别。

如果故事就这么结束的话，它看起来的确非常低效。然而，React 在重新渲染方面，有点特殊。

当 React 进行重新渲染时，它首先会渲染到虚拟 DOM 中，这不是一个实际的 DOM 对象的图。而是一个轻量级的，有纯粹的 object 和 array 组成的纯 JavaScript 的数据结构，它代表着一个真实的 DOM 对象的图。

然后，一个独立的进程会根据虚拟 DOM 的结构来创建那些在屏幕上显示的真实的 DOM 元素。



![onchange_vdom_initial.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_vdom_initial.svg)



之后，当变化发生的时候，一个新的虚拟 DOM 会被从头到尾创建出来。这个新的虚拟 DOM 将映射出数据模型的新的状态。现在 React 在手上有两个虚拟 DOM：一个新的，一个旧的。然后会对两个虚拟 DOM 进行一个对比算法，得出它们之间的一组变化。有且只有这些更改会被应用到真实 DOM 中：此元素已添加，此属性以改变，等等。



![onchange_vdom_change.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_vdom_change.svg)



所以 React 起码至少有一个好处，就是你不用追踪变化了。你只需要每次重新渲染整个 UI ，然后无论改变了什么最终都会得到相应的结果。React 的虚拟 DOM 对比算法，能让你做到这一点，并且最大限度的节省昂贵的 DOM 操作。



## Om: 不可改变的数据结构

> 我确切的知道哪些没有改变。

虽然 React 的虚拟 DOM 相当的块，但是当你的 UI 非常庞大或者经常性渲染的时候（例如：每秒高达 60 次），它依然会面临瓶颈。

问题在于，真的没办法每次都渲染出整个虚拟 DOM，除非你引入一些方法来控制数据模型的改变，就像 Ember 做的一样。

一种控制变化的办法是 [不可改变的，持久化的数据结构](http://en.wikipedia.org/wiki/Persistent_data_structure)。这些看起来似乎很适合使用在 React 的虚拟 DOM 中，正如 David Nolen 在 [Om](https://github.com/omcljs/om) 库中所做的 [工作](http://swannodette.github.io/2013/12/17/the-future-of-javascript-mvcs/) 那样，一个构建于 React 和 [ClojureScript](https://github.com/clojure/clojurescript) 之上的库。

有一点关于不可改变数据结构的是，顾名思义，你永远不能改变它，只能产生新的版本。如果你想改变一个对象的属性，你只能新建一个对象和属性，因为你不能改变已经存在的那一个。由于持久化数据结构的工作方式，这比听起来更加有效率。

这意味着在检测变化方面，当 React 组件都只由不可变数据组成的时候，只有一个逃生窗口：当你重新渲染一个组件时，组件的状态仍然指向上次渲染时的相同数据结构，你就可以跳过这次重新渲染。你可以使用该组件的先前的虚拟 DOM 以及源自该组件的整个组件树。没有必要进一步挖掘，因为在这个状态中所有东西都不可能改变。



![onchange_immutable.svg](http://om6ayrafu.bkt.clouddn.com/post/change-and-its-detection-in-javascript-frameworks/onchange_immutable.svg)



就像 Ember 一样，像 Om 的这种库不允许在你的数据中使用旧的 JavaScript 对象图。你必须在不可变数据结构中构建你的数据模型，从而才能在其中得到好处。我会赞同这样的做法，因为这一次你这样做并不是为了取悦框架本身。你这样做只是因为这是一个又简单又好的方式去管理你的应用状态。使用不可变数据结构的主要好处，并不是提升渲染性能，而是简化你的应用结构。

虽然 Om 和 ClojureScript 已经讲 React 和不可变数据结构融合起来，但是他们并不是圈子里面的唯一组合。而仅仅使用 React 和 Facebook 的 [Immutable-js](http://facebook.github.io/immutable-js/) 是完全可能的。这个库的作者 Lee Byron 在最近的一次 React.js 为主题的会议中进行了一个 [精彩的介绍](https://www.youtube.com/embed/I7IdS-PbEgI)。

同时我建议看一下 Rich Hickey's 的 [Persistent Data Structures And Managed References](http://www.infoq.com/presentations/Value-Identity-State-Rich-Hickey), 去了解状态管理的方法。

我自己现在一直在为不可变数据数据结构 [写诗](http://blog.deveo.com/immutability-in-ruby-part-1-data-structures/)，但我绝对没有预见到它会进入前端 UI 框架行列。它看起来似乎不遗余力的发生着，而 Angular 的人 [正在为支持这个而努力着](http://victorsavkin.com/post/110170125256/change-detection-in-angular-2)。



## 总结

检测变化时 UI 开发中的核心问题，而 JavaScript 框架们以各种方式解决这个问题。

EmberJS 能在它们发生变化的时候检测到，因为它控制着你的数据模型 API，并且可以在你调用它的时候触发事件。

Angular.js 是事后进行检测， 它通过重新运行你已经在 UI 中注册的所有数据绑定，来检测它们的值是否已经发生变化。

React 的检测方法是通过把整个 UI 重新渲染成一个虚拟 DOM，然后和旧的版本进行对比。无论改变了什么，都可以给真实 DOM 打上个补丁。

React 和 不可变数据结构的组合，对比纯粹的 React 有所增强，通过快速的在组件树中标记不可变的节点。因为组件内的变化是不被允许的。但是，这不是主要出于性能的原因，而是由于它对整个应用程序体系结构有积极的影响。


## 原文链接

[Changes and Its detection of JavaScript Framework](http://teropa.info/blog/2015/03/02/change-and-its-detection-in-javascript-frameworks.html)