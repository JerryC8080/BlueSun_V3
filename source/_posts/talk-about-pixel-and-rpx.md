---
title: 谈谈像素以及微信小程序的 rpx
category: 搬砖码农
date: 2017-05-21 14:21:25
tags: 
- 前端
---

# 前言
最近在负责有赞的某个业务的微信小程序开发，这是我第一次着手微信小程序的开发，这个过程中发现微信小程序所定义的一套 WXSS (WeiXin Style Sheets) 中有一个有趣的长度单位 `rpx`，即 responsive pixel。
根据官方的描述：
> rpx（responsive pixel）， 可以根据屏幕宽度进行自适应。规定屏幕宽为750rpx。如在 iPhone6 上，屏幕宽度为375px，共有750个物理像素，则750rpx = 375px = 750物理像素，1rpx = 0.5px = 1物理像素。

平时我们一般会用 `em` 或者 `rem` 来做屏幕适配，而在微信小程序中，可以方便的借助 `rpx` 来完成这项工作。

那么怎么理解 `rpx`，还有它与 `px` 之间什么关系？什么是物理像素？
为了更好理解 `rpx`，我打算聊聊下面的一些概念：
1. 像素 (Pixel)
2. PPI (Pixels per inch 每英尺像素)
3. DPR (Device pixel ratio)

# 像素
像素，英文单词：pixel，是英语单词 「picture」 的简写 「pix」，加上 「element」 的简写 「el」，合成的词汇，表示「图像元素」的意思。 
一个像素只能表达一个色块，是显示的最小的一个单元。

而在我们写代码的时候，可以把像素分为两种：

1. 物理像素 Physical pixels
2. 逻辑像素 Logical pixels

## 物理像素
也被称为设备像素 (Device independent pixels)，即设备在出厂的时候就已经固定了像素。

我们来看一下 iPhone6 (左图) 与 iPhone6 plus (右图) 的官方显示屏的规格说明：

![iPhone6 & iPhone6 plus 规格](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/post/talk-about-pixel-and-rpx/518488434BEC1074B675EB42A5A57AEF.png)

iPhone6 是 `1334px x 750px` 的像素分辨率，意思是当手机竖放的时候，横向有 750 个物理像素，纵向有 1334 个物理像素。

## 逻辑像素
在 CSS 中也被称为 CSS 像素 (CSS pixels)，是为 Web 开发者创造的，在 CSS 和 JavaScript 中使用的一个抽象的层，每一个 CSS 声明和几乎所有的 Javascript 属性都使用 CSS 像素。

例如我们平时使用 Chrome 的设备调试工具的时候，iPhone6 是高 `667px`，宽是 `375px`，与苹果官方的 `1334px x 750px`，长宽分别少了 2 倍，那么面积就少了 4 倍。这就是经常说的 Retina 屏幕用四个(物理)像素表示一个(逻辑)像素。

![Chrome 下 iPhone6 逻辑像素](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/post/talk-about-pixel-and-rpx/9C4CD0061C94690AF81DB8DED8F71252.png)

# PPI

Pixels per inch，每英寸像素，也被称为像素密度，意思是一英寸中有多少个物理像素。
其中 1英寸 (inch) = 2.54厘米 (cm)。

回顾一下上面的 iPhone6 和 iPhone6 plus 的官方规格说明图，其中有 `ppi` 这一项，iPhone6 是 `326ppi`，iphone6 plus 是 `401ppi`。

## PPI 怎么算出来的？

要计算显示器的每英寸像素值，首先要确定屏幕的尺寸和分辨率。
PPI 计算公式：

![PPI 计算公式](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/post/talk-about-pixel-and-rpx/855BB6047CE2CA7F9DBBF1791D52C6CC.gif)

其中，

* dp (device pixel) 为屏幕对角线的分辨率
* wp (width pixel) 为屏幕横向分辨率
* hp (height piexl) 为屏幕纵向分辨率
* di (device inch) 为屏幕对角线的长度(单位为英寸)。

以 iPhone6 为例：

![iPhone6 PPI 计算](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/post/talk-about-pixel-and-rpx/2A67EB1D8C0873E419C676DB430570C2.gif)

四舍五入那便是 `326ppi` 了。

## 物理像素有多大？

「物理像素」是有特定长度的，这取决于 ppi 值。

那么如何求出一个设备的物理像素的长度？
因为绝大多数设备的物理像素都是方形的，我们可以假设当前设备的像素是方形的。
那么，

* iPhone6 中每个像素长度：1inch / 326ppi ≈ 0.003 inch = 0.0762mm
* iPhone6 plus 中每个像素长度：1inch / 401ppi ≈ 0.002 inch = 0.0508mm

可以看出 iPhone6 plus 的屏幕制作工艺更加精细。
因为像素越小，那么单位面积内像素点就越多，显示的效果人眼就越难看出毛刺。
用来显示一份图像的像素越多，效果就越接近现实。

和物理像素不同，「逻辑像素」没有特定的物理长度的，只是表示显示设备中最小的显示单元，优秀的显示设备完全可以把显示单元做的更加小，以达到更好的显示效果。

# DPR
Device Pixel Ratio，设备像素比。

在早先的移动设备中，并没有 DPR 的概念。随着技术的发展，移动设备的屏幕像素密度越来越高。
从 iPhone4 开始，苹果公司推出了所谓的 Retina 视网膜屏幕。之所以叫做视网膜屏幕，是因为屏幕的 PPI 太高，人的视网膜无法分辨出屏幕上的像素点。
iPhone4 的分辨率提高了一倍，但屏幕尺寸却没有变化，这意味着同样大小的屏幕上，像素多了一倍，于是 `dpr = 2`。

在 Chrome 浏览器可以通过以下代码获取设备的 DPR：

```
let dpr = window.devicePixelRatio;
```

而通过下面的代码可以获取设备的逻辑像素：

```
let logicalHeight = screen.height;
let logicalWidth = screen.width;
```

那么很多人看到这里，就会认为：`物理像素 = 逻辑像素 * dpr`
但实际情况并不是这样，
留意一下 iPhone6 plus 的物理像素和逻辑像素：

 * 物理像素：`1080px x 1920px`
 * 逻辑像素：`414px x 736px`
 
而官方声称 iPhone6 plus 的 `dpr = 3`，按理应该是：

 * `414px x 736px` → 乘以 3 倍 dpr → `1242px x 2208px`
 
那么 iPhone6 plus 只有 `1080px x 1920px`，怎么去展示 `1241px x 2208px` 的分辨率呢？

原来 iPhone6 plus 对逻辑像素做了缩小处理，以适应物理像素，也就是
`1241px x 2208px` 除以 `115%` ，得到 `1080px x 1920px`。

换句话来说，本来 iPhone6 plus 的 `dpr = 2.6`，但是通过虚拟技术把物理像素放大 115% ，以达到 `dpr = 3` 的效果。

所以说是假 3 倍 dpr，其实我们开发和设计的时候也不用管这个，当作它就是 3 倍 dpr 就好了。


# 回到 rpx

根据官方给出的 rpx 换算 px 的实例：
![rpx 换算 px](https://bluesun-1252625244.cos.ap-guangzhou.myqcloud.com/post/talk-about-pixel-and-rpx/ACED349F80C8D926AB74922C360B2F5A.png)

三款机器的逻辑像素：

* iPhone5 : `320px x 568px`
* iPhone6 : `375px x 667px`
* iPhone6 plus : `414px x 736px`

rpx 转换成 px 是需要乘以一个系数的：

* `px = rpx * n`

其中系数 n，是跟着设备改变的：

* iPhone5: `n = 2.34`
* iPhone6: `n = 2`
* iPhone6 plus: `n = 1.81`

所以 rpx 只是定义一个绝对值 750 宽度，然后简单的根据不同设备的逻辑像素来进行 rpx 到 px 的换算。

精明的观众可能发现了， rpx 压根就不需要关心 DPR 和 PPI 的概念。
呃，其实我就是在理解 rpx 的过程中，拦不住思维的发散，了解了一大堆概念，然后顺道给你们分享一下罢了。

# 参考
[Wiki - 像素](https://www.wikiwand.com/zh-sg/%E5%83%8F%E7%B4%A0)
[Wiki - 每英寸像素](https://www.wikiwand.com/zh-sg/%E6%AF%8F%E8%8B%B1%E5%AF%B8%E5%83%8F%E7%B4%A0)
[iPhone 6 Screens Demystified](https://www.paintcodeapp.com/news/iphone-6-screens-demystified)

