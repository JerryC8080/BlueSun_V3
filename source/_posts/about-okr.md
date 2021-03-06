---
title: 关于 OKR 的一些方法论
category: 三省吾身
date: 2019-07-06 22:53
---

# 前言

OKR 是由前 Intel CEO，[安迪·葛洛夫](https://www.wikiwand.com/zh-hk/%E5%AE%89%E8%BF%AA%C2%B7%E8%91%9B%E6%B4%9B%E5%A4%AB) 构建的基本框架。

全称是：「Objective - Key Result」，既强调「目标」与衡量目标的「关键结果」

它是一套管理目标，让目标能落地的工具。
它在硅谷科技公司中广为人知，并被世界各地的许多组织采用。
它可以应用在组织中，也可以应用在个人的生活中，就像一种思考的模式。

过去两年多的 OKR 实践，有一些体会。
作为一个程序员，会自然的去寻找一个工具的最佳实践。

于是，有了这篇文章。

# 基本原理

OKR 原理很简单。

要用好 OKR，我的理解，需要把握三个核心：

* 目标
* 关键结果
* 过程管理

它们分别回答了三个问题：

* 应该做什么？
* 如何衡量做到了？
* 怎么落地？

然后，思考 OKR，我认为还需要 cover 到两点：

* 看得到的结果
* 说得出的价值

**先抛一个不好的例子**

来自于我曾经定过的一个 OKR：

> O: 持续学习，提高自身战斗力
> - KR1: CSS3 学习，阅读《CSS揭秘》产出阅读笔记。
> - KR2: 提高英文阅读能力，阅读《Security Your NodeJS Application》，产出一篇译文。
> - KR3: 对 Eggjs 或 Vue2 框架的源码进行解读，产出一篇源码解析。

我想先按顺序来讲讲「目标」、「关键结果」、「过程管理」。
然后，再回过头来，看看这个例子为啥糟糕，可以怎样修改。

### 目标 Objective

> 欲望让我们起航，但只有专注、规划和学习才能到达成功的彼岸

##### 组织的诞生

回到最初的时候，一个组织的诞生，绝大多数情况是由于一两个人的想法，然后以此为中心，开始聚拢更多有共同目标的人加入进来。

1976年，乔布斯成功说服沃茲尼克組裝机器之后再拿去推销，他们的另一位朋友韦恩随后加入，三人在1976年4月1日成立苹果电脑公司。最初，Apple 仅仅是在卖组装电脑。

1996年，佩奇和布林在学校开始一项关于搜索的研究项目，开发出了搜索引擎 PageRank，后续改名 Google。最初，Google 仅仅是一个搜索引擎。

##### 组织的使命

随着组织发展，人员壮大，这个能聚拢人的目标，必须要看得远。然后这个目标提升到用另一个词来形容 —「使命」。

Apple 的使命：「藉推广公平的资料使用惯例，建立用户对互联网之信任和信心」
Google 的使命：「整合全球信息，使人人皆可访问和收益」
阿里巴巴的使命：「让天下没有难做的生意」
有赞的使命：「帮助每一位重视产品和服务的商家成功」
以及最近我们团队的前端技术委员的使命：「以极致的技术高效支撑业务」

使命描述一般都很简洁，并且容易记忆，像一句广告词，能深深的刻在脑海里。
在工作中遇到问题的时候，这个使命就会一下子从脑海里蹦出来指引你找到答案。

其实在某个市场闲逛都有可能让你意识到这个市场有某个问题需要解决，而帮市场解决这个问题，就是一个使命。

##### 阶段性的目标

为了一步步的达成「使命」，我们需要有目标。相对于使命，它粒度更小，且有时间限制。

所以，目标（Objective）应该：
* 是阶段性的
* 是有优先级的
* 它需要能明确方向且鼓舞人心

目标，是 OKR 中最重要，最需要想清楚，最首要确定的。
在这里，需要回答：你有什么？你要什么？你能放弃什么？

##### 重要与紧急

「鱼与熊掌不可得兼」，所以我们要有所取舍，事情排个优先级。
「重要-紧急象限」是一个不错的指导工具，第一次看到它是在柯维《高效能人士的7个习惯》中的第三个习惯「要事第一」。

![重要-紧急](https://img.yzcdn.cn/public_files/2019/07/06/e5ce3614f98f98d538944350bd505993.png)

但在实施的过程中中很有可能会遇到这样一个问题，紧急不重要的事情很紧急，总需要花时间和精力去处理它。然后重要不紧急的事情，会常常分配不到时间和精力。

**那么就让重要不紧急的事情也变得紧急起来。**

##### 目标需要自上而下的关联

如果基础的商业问题没有解决，不论实现多少产品功能，团队整体的绩效一定会大打折扣。

在一个组织中，如果没有充分的理解上一层的目标，就很容易跑偏，没有真正在刀刃上使力，造成效率上的浪费。

达到充分的理解目标，是有难度的，对人的眼界、目标理解能力有很高的要求。这不仅仅是执行者责任，更是管理者的责任。


### 关键结果 Key Result

##### 衡量目标是否达成

目标定下来了，如果不去执行和落地，那么它永远就只是一个目标。如何去衡量目标是否达到了，就是「关键结果」的任务。

在互联网产品中，通常可以量化的条件有：用户增长、用户激活、收入增长、产品性能、产品质量。

作为技术团队，会更加集中注意力在产品性能和产品质量上面，那么如何去找到这些方向的衡量指标，就要从实际出发了。

比如我们团队会用「质量系数 = BUG数/估时」，来感受一个项目的质量情况。虽然它会有些漏洞，但如果建立在互相信任的基础上，可以提供一定的参考价值。

##### 有些挑战性

> 当达到成结果的时候，我们应该是欢呼雀跃般的兴奋，而不是理所应当的淡定。

定下一个关键结果之后，问一下自己，有多少信心可以完成。如果信心爆棚，就把目标定高些。如果信心不足，就把目标调低些。因为 OKR 的意义不在于完成目标，更重要的是它能挖掘团队以及个人的潜力。

如果觉得有必要的话，我们可以建立一个「信心指数」，用来帮助确定结果有足够的挑战性而不会让人失去信心。这个指数的开始值最好是 50%，然后通过过程管理来动态变更和追踪。

比如去年我负责的一个「优化微信小程序加载性能」项目中的关键结果：

* 首屏加载时间 3s 内

未优化的加载时间是 6s+，回顾当时对目标的信心指数的话，大概是 20%。虽然最后因为部分不可控因素没有达到这个目标，只能维持在 3s-4s 之间。但是这个过程中能让人费尽脑汁的找到各种方法，大幅的提升了除首屏加载以外其他方面的加载体验，这也是额外的收获。

作为管理者，你要清楚的知道哪些人推一推会有更高的产出，哪些人实际执行情况会出现问题，要能看得到看得懂目前组织的目标和进度，并与成员进行同步。

### 过程管理

OKR 定下来了，在期限内，就要奔着目标努力奋进。尽管中途发现问题，也尽量不要在中途更改 OKR，让我们尽力跑完计划的阶段再回来总结。我们也可以把时间维度切小，比如把年度切分为半年度，把半年度切分为季度。

并且，目标定下来之后，要经常定期共同回顾，共同看见。而不是定下来了，就放在那里，否则过程中团队发生了问题，成员遇到了困难，很大可能会不被看到。

比较好的形式是每周都一起坐下来看看，每个人分享一下成果，或者说说遇到的困难，看能不能得到其他人的帮助。这个过程，能及时的看到问题，也能让成员对目标有更强的参与感。

那么，OKR应该以什么方式来呈现？《OKR工作法》一书中提供了一种参考：「四象限呈现形式」

![四象限呈现](https://img.yzcdn.cn/public_files/2019/07/06/989bdd617bc44bab7dcfdd18120ac8a8.jpeg)

* 第一象限：本周3-4件最重要的事情，并且进行优先级的排序
* 第二象限：把OKR内容罗列出来，关注和更新每一项KR的信心指数
* 第三象限：未来中长段时间中的计划，能让我们稍微看远一些。
* 第四象限：关注那些影响目标的关键因素会不会掉链子，例如团队状态，系统状态等。也可以用红蓝黄颜色表示出来。

# 回过头看看那个糟糕的例子

糟糕的例子：

> O: 持续学习，提高自身战斗力
> - KR1:CSS3 学习，阅读《CSS揭秘》 产出阅读笔记。
> - KR2:提高英文阅读能力，阅读《Security Your NodeJS Application》，产出一篇译文。
> - KR3: Vue2 框架的源码进行解读，产出一篇源码解析。

这个例子的背景是我 2017 年 4 月份加入到有赞，当时定的试用期内的其中一个目标。那时是我第一次认识和使用 OKR，只是单纯的把自身的技能提升计划给罗列了出来，看起来更像是一个 Todo List

现在回过头来看这一份 OKR，有不少问题：

1. 目标没有描述出来价值，提升了自身战斗力，然后呢？并没有自上而下的关联团队和组织的目标。所以从目标上，就已经走偏了。
2. 假设目标正确，KR 也没有起到能衡量目标是否达成的作用。例如 KR1 完成了，对目标的推进，并没有说服力。
3. 最后把 OKR 用成了 Todo List。

那么我们从目标开始分析，当时作为一个新人加入到一个新的团队，对团队的技术栈和项目都很陌生，需要填补部分空白，快速上手。所以提升自身实力的底层诉求是：快速上手，胜任开发工作。

然后怎么衡量目的达到了呢？我们可以通过项目质量直接衡量，通过项目的熟悉程度来间接衡量。

修正后：

> O: 快速上手，以专业的姿态胜任开发工作。
>   * KR1: 质量系数平均在 0.3 以内。（质量系数 = BUG数/估时）
>   * KR2: 代码评审评分平均 3.5 以上。（我们有 Code Review 机制，并且有评分环节）
>   * KR3: 所参与项目评分在 4 以上。（项目也有评分环节）
>   * KR4: 进行两次的项目分享。

那么如果达到这些关键结果，要通过学习框架，还是研究项目，还是熟悉业务，那就是根据实际迎刃而解的事情了。

# 最后

> 凡事预则立，不预则废 ——《礼记·中庸》

最后要注意的是，OKR 只是一个工具，当你有一个目标，它会给你一种落实目标的方法论。而如果一开始目标没有想清楚，想明白，那就很容易在错的路上越走越远。

每个团队都会有不同的风格，和不同的实际情况。理解方法和工具的原理，明白这么做是为了解决什么问题，然后再调整定制真正适合此时此刻的团队，才是最好的方法。