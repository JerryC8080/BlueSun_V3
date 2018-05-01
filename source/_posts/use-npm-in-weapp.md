---
title: 原汁原味的配方:「微信小程序支持 NPM」
date: 2018-05-02 00:07:00
tags:
- 微信小程序
category: 搬砖码农
---

微信小程序本身不支持 npm 包的使用，目前市面上很多框架也有了相对应的解决方案。

本文旨在为那些不愿意引入第三方框架， 想在小程序环境中写原汁原味代码的人（例如我），提供一种解决问题的思路。

在现代的 Web 开发中，我们对 Webpack 已经再熟悉不过了，简单理解，它就是项目发布之前，把所有资源都打包好，然后提供一个入口文件，在入口模板中引入这个入口文件。

那么我的思路，就是利用 Webpack 把我们所有的 npm 依赖打包好，提供一个入口文件，在小程序开发中，我们通过这个入口文件，进而使用 npm 的依赖。

![](http://om6ayrafu.bkt.clouddn.com/post/use-npm-in-weapp/80EBDB3CEAB5B74F18E1F61F9FC519FB.jpg)

我们最终实现的效果应该是这样的。

例如我们小程序的首页中，需要使用到 `moment`

pages/home/home.js：

```javascript
const { moment } require('../npm/index');
const time = moment();
```


# Webpack 打包 npm 依赖

webpack 默认输出的 `bundle.js` ，是一个立即执行的闭包，如以下：

使用 webpack.config.js 配置：

```javascript
const path = require('path');

module.exports = {
  entry: './foo.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  }
};
```

运行 `$ webpack` 生成的 `bundle.js` :

```javascript
(function(modules) { 

  // webpackBootstrap

})([module1, module2, module3]);
```

这样的代码，显然没法达到我们要的效果。
幸好 webpack 提供了 `output.libraryTarget` 的配置项。

> 示例代码：https://github.com/JerryC8080/use-npm-in-weapp/tree/master/step1

## output.libraryTarget: "commonjs2"

对于 `output.libraryTarget: "commonjs2"` 官方解释：
> The return value of your entry point will be assigned to the module.exports.

通过配置该属性，我们能保证 webpack 打包出来的 `bundle.js`，是模块化的。
当然 `output.libraryTarget` 还有其他的选项值，可以查阅[官方文档](https://webpack.js.org/configuration/output/#output-librarytarget)。

例如，使用 webpack.config.js 配置:

```javascript
const path = require('path');

module.exports = {
  entry: './foo.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2',
  }
};
```

运行 `$ webpack` 生成的 `bundle.js` :

```javascript
module.exports = (function(modules) { 

  // webpackBootstrap

})([module1, module2, module3]);
```

> 示例代码：https://github.com/JerryC8080/use-npm-in-weapp/tree/master/step2

这样，我们就可以通过 `require('bundle.js')`, 来使用 npm 依赖了。
在这个基础上，我们就可以打造一个使用 npm 依赖的入口。

## 打造 npm 入口

建立入口文件：npm.js

```javascript
const momennt = require('moment');

module.exports = {
    momennt,
};
```

配置文件：webpack.config.js

```javascript
const path = require('path');

module.exports = {
    entry: './entry.js',
    output: {
        path: path.resolve(__dirname, 'npm'),
        filename: 'index.js'
    },
};
```

运行 `$ webpack`，输出 `./npm/index.js` 打包文件，对应的目录：

```
.
├── entry.js
├── npm
│   └── index.js
└── webpack.config.js
```

> 示例代码：https://github.com/JerryC8080/use-npm-in-weapp/tree/master/step3

笨拙点的方法，你只需要把 `npm/index.js` 拷贝到你的项目中，就可以使用你所引入的 npm 包的内容了。

如果你的项目中使用了构建工具的话，就可以把「 webpack 打包 npm」 的这项任务加入到你的构建流程中。

我是使用 gulp 来做项目构建工作的，下面提供一种基于 gulp 的实现作为参考。

# 结合 Gulp 做项目工程化

工程目录：

```
.
├── dist
│   ├── npm
│   │   └── index.js
│   └── pages
│       └── home
│           └── home.js
├── gulpfile.js
└── src
    ├── npm
    │   └── index.js
    └── pages
        └── home
            └── home.js
```

而 gulpfile 负责两件事：
1. 把 src 的 js 文件通过 babel 编译到 dist 目录（示例中忽略其他 wxml、wxss 文件）
2. 把 `npm/index.js` 通过 webpack 打包到 `dist/npm/index.js`，并压缩。

gulpfile.js:

```javascript
const gulp = require('gulp');
const babel = require('gulp-babel');
const del = require('del');
const runSequence = require('run-sequence');
const webpack = require('webpack');
const webpackStream = require('webpack-stream');

const webpackConfig = {
    module: {
        loaders: [{
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: /node_modules/,
            options: {
                presets: ['es2015'],
            },
        }],
    },
    output: {
        filename: 'index.js',
        libraryTarget: 'commonjs2',        
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin(),
    ],
};

// 清空 ./dist 目录
gulp.task('clean', () => del(['./dist/**']));

// 打包 npm 依赖
gulp.task('npm', () => {
    gulp.src('./src/npm/*.js')
        .pipe(webpackStream(webpackConfig), webpack)
        .pipe(gulp.dest('./dist/npm'));
});

// 编译 JS 文件
gulp.task('scripts', () => {
    gulp.src(['./src/**/*.js', '!./src/npm/*.js'])
        .pipe(babel({
            presets: ['stage-0', 'es2015'],
        }))
        .pipe(gulp.dest('./dist'));
});

// 开发模式命令
gulp.task('build', ['clean'], () => runSequence('scripts', 'npm'));
```

> 示例代码：https://github.com/JerryC8080/use-npm-in-weapp/tree/master/step4

# 关于控制 npm 文件代码量

微信限制了项目的代码量为 2M，就算使用了分包机制，最多也是 4M 的代码量。
区区一个 moment 库的话，就算压缩过，也需要两百多 KB，这对于我们的代码量，是很不友好的。
我们需要对 npm 的引入持非常谨慎的态度，去度量每个依赖包的大小，想尽各种办法减少依赖的代码量。
譬如`moment` 我们可以使用 `moment-mini` 来代替，后者压缩过后只需要 51KB。

而且我认为把 npm 的依赖放在一个入口文件中，会让我们可以对 npm 的依赖有一个全局的把握。