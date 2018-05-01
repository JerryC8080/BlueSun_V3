---
title: 加深对 JavaScript This 的理解
category: 搬砖码农
date: 2017-07-15 10:40:00
tags: 
- javascript
---

我相信你已经看过很多关于 JavaScript 的 `this`  的谈论了，既然你点进来了，不妨继续看下去，看是否能帮你加深对 `this` 的理解。

最近在看 [《You Dont Know JS》](https://github.com/getify/You-Dont-Know-JS) 这本书，不得感叹，就算用了 JS 很多年的老前端来看这本书，我觉得还是会有不少的收获。

其中关于 `this` 的讲解，更是加深了我对 `this` 的理解，故整理知识点，再加上自身的理解，以自己的语言来描述。
对读者来说，算是二手知识，这本书是开源的，可以到本书的 Github 项目地址学习一手的知识。

首先有一句大家都明白的话，我还是要强调一遍：
**「`this` 是在函数被调用时发生的绑定，它指向什么完全取决于函数在哪里被调用。」**

这句话很重要，这是理解 `this` 原理的基础。
而在讲解 `this` 之前，先要理解一下作用域的相关概念。

# 「词法作用域」与「动态作用域」
通常来说，作用域一共有两种主要的工作模型。

* 词法作用域
* 动态作用域

词法作用域是大多数编程语言所采用的模式，而动态作用域仍有一些编程语言在用，例如 Bash 脚本。
而 JavaScript 就是采用的词法作用域，也就是在编程阶段，作用域就已经明确下来了。

思考下面代码：

```JavaScript
function foo(){
  console.log(a);   // 输出 2
}

function bar(){
  let a = 3;
  foo();
}

let a = 2;

bar()
```

因为 JavaScript 所用的是词法作用域，自然 `foo()` 声明的阶段，就已经确定了变量 `a` 的作用域了。

倘若，JavaScript 是采用的动态作用域，`foo()` 中打印的将是 `3`

```JavaScript
function foo(){
  console.log(a);   // 输出 3 （不是 2）
}

function bar(){
  let a = 3;
  foo();
}

let a = 2;

bar()
```

而 JavaScript 的 `this` 机制跟动态作用域很相似，是在运行时在被调用的地方动态绑定的。

# this 的四种绑定规则

在 JavaScript 中，影响 this 指向的绑定规则有四种：

* 默认绑定
* 隐式绑定
* 显式绑定
* new 绑定

## 默认绑定
这是最直接的一种方式，就是不加任何的修饰符直接调用函数，如：

```javascript
function foo() {
  console.log(this.a)   // 输出 a
}

var a = 2;  //  变量声明到全局对象中

foo();
```

使用 `var` 声明的变量 `a`，被绑定到全局对象中，如果是浏览器，则是在 `window` 对象。
`foo()` 调用时，引用了默认绑定，`this` 指向了全局对象。

## 隐式绑定
这种情况会发生在调用位置存在「上下文对象」的情况，如：

```javascript
function foo() {
  console.log(this.a);
}

let obj1 = {
  a: 1,
  foo,
};

let obj2 = {
  a: 2,
  foo,
}

obj1.foo();   // 输出 1
obj2.foo();   // 输出 2
```

当函数调用的时候，拥有上下文对象的时候，`this` 会被绑定到该上下文对象。
正如上面的代码，
`obj1.foo()` 被调用时，`this` 绑定到了 `obj1`, 
而 `obj2.foo()` 被调用时，`this` 绑定到了 `obj2`。

## 显式绑定
这种就是使用 `Function.prototype` 中的三个方法 `call()`, `apply()`, `bind()` 了。
这三个函数，都可以改变函数的 `this` 指向到指定的对象，
不同之处在于，`call()` 和 `apply()` 是立即执行函数，并且接受的参数的形式不同：

* `call(this, arg1, arg2, ...)`
* `apply(this, [arg1, arg2, ...])`

而 `bind()` 则是创建一个新的包装函数，并且返回，而不是立刻执行。

* `bind(this, arg1, arg2, ...)`

`apply()` 接收参数的形式，有助于函数嵌套函数的时候，把 `arguments` 变量传递到下一层函数中。

思考下面代码：

```javascript
function foo() {
  console.log(this.a);  // 输出 1
  bar.apply({a: 2}, arguments);
}

function bar(b) {
  console.log(this.a + b);  // 输出 5
}

var a = 1;
foo(3);
```

上面代码中， `foo()` 内部的 `this` 遵循默认绑定规则，绑定到全局变量中。
而 `bar()` 在调用的时候，调用了 `apply()` 函数，把 `this` 绑定到了一个新的对象中 `{a: 2}`，而且原封不动的接收 `foo()` 接收的函数。

## new 绑定
最后一种，则是使用 `new` 操作符会产生 `this` 的绑定。
在理解 `new` 操作符对 `this` 的影响，首先要理解 `new` 的原理。
在 JavaScript 中，`new` 操作符并不像其他面向对象的语言一样，而是一种模拟出来的机制。
在 JavaScript 中，所有的函数都可以被 `new` 调用，这时候这个函数一般会被称为「构造函数」，实际上并不存在所谓「构造函数」，更确切的理解应该是对于函数的「构造调用」。

使用 `new` 来调用函数，会自动执行下面操作：

1. 创建一个全新的对象。
2. 这个新对象会被执行 [[Prototype]] 连接。
3. 这个新对象会绑定到函数调用的 this。
4. 如果函数没有返回其他对象，那么 new 表达式中的函数调用会自动返回这个新对象。

所以如果 `new` 是一个函数的话，会是这样子的：

```javascript
function New(Constructor, ...args){
    let obj = {};   // 创建一个新对象
    Object.setPrototypeOf(obj, Constructor.prototype);  // 连接新对象与函数的原型
    return Constructor.apply(obj, args) || obj;   // 执行函数，改变 this 指向新的对象
}

function Foo(a){
    this.a = a;
}

New(Foo, 1);  // Foo { a: 1 }
```

所以，在使用 `new` 来调用函数时候，我们会构造一个新对象并把它绑定到函数调用中的 `this` 上。

# 优先级

如果一个位置发生了多条改变 this 的规则，那么优先级是如何的呢？

看几段代码：

```javascript
// 显式绑定 > 隐式绑定
function foo() {
    console.log(this.a);
}

let obj1 = {
    a: 2,
    foo,
}

obj1.foo();     // 输出 2
obj1.foo.call({a: 1});      // 输出 1
```

这说明「显式绑定」的优先级大于「隐式绑定」

```javascript
// new 绑定 > 显式绑定
function foo(a) {
    this.a = a;
}

let obj1 = {};

let bar = foo.bind(obj1);
bar(2);
console.log(obj1); // 输出 {a:2}

let obj2 = new bar(3);
console.log(obj1); // 输出 {a:2}
console.log(obj2); // 输出 foo { a: 3 }
```

这说明「new 绑定」的优先级大于「显式绑定」
而「默认绑定」，毫无疑问是优先级最低的。
所以优先级顺序为：

**「new 绑定」 > 「显式绑定」 > 「隐式绑定」 > 「默认绑定。」**

# 所以，this 到底是什么

`this` 并不是在编写的时候绑定的，而是在运行时绑定的。它的上下文取决于函数调用时的各种条件。
`this` 的绑定和函数声明的位置没有任何关系，只取决于函数的调用方式。
当一个函数被调用时，会创建一个「执行上下文」，这个上下文会包含函数在哪里被调用（调用栈）、函数的调用方式、传入的参数等信息。`this` 就是这个记录的一个属性，会在函数执行的过程中用到。

# 参考
[《You Dont Know JS》- this & Object Prototypes](https://github.com/getify/You-Dont-Know-JS/blob/master/this%20&%20object%20prototypes/README.md#you-dont-know-js-this--object-prototypes)