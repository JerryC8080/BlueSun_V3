---
title: 原生JavaScript实现拖拽效果
category: 搬砖码农
date: 2014-07-12 15:45:37
tags:
- Javascript
---

## 前言

闲着无事干，突然想做一个类Q+ Web桌面的东西，当然那是一个大工程（对本菜鸟来说）。那么，这个Demo就是第一步，起码可以实现图标的拖拽效果。
截图：




```HTML
<!DOCTYPE html>
<html>
<head lang="en">
    <meta charset="UTF-8">
    <title>Drag Demo</title>
    <style>
        body{
            background:url(images/bg.jpg) no-repeat;
            background-size:100%;
            padding: 20px ;
        }
        .icon{
            width: 100px;height: 100px;margin-bottom:15px;position: absolute;cursor: move;
        }
        .icon-0{
            background: url("images/png/0.png") no-repeat;background-size: 100%;
            top: 20px;
            left: 20px;
        }
        .icon-1{
            background: url("images/png/1.png") no-repeat;background-size: 100%;
            top: 140px;
            left: 20px;
        }
        .icon-2{
            background: url("images/png/2.png") no-repeat;background-size: 100%;
            top: 260px;
            left: 20px;
        }
        .icon-3{
            background: url("images/png/3.png") no-repeat;background-size: 100%;
            top: 380px;
            left: 20px;
        }
        .icon-4{
             background: url("images/png/4.png") no-repeat;background-size: 100%;
             top: 500px;
             left: 20px;
        }


    </style>
</head>

<body>
    <div class="icon icon-0"></div>
    <div class="icon icon-1"></div>
    <div class="icon icon-2"></div>
    <div class="icon icon-3"></div>
    <div class="icon icon-4"></div>
</body>

<script type="text/javascript">
    function g(el){ return document.getElementsByClassName(el);}

    var icons = g('icon');
    var instace = false; //存放当前移动对象信息

    for(var i =0 ; i<icons.length ; i++){
        if(icons[i]) {
            icons[i].addEventListener('mousedown', function (e) {

                instace = {};
                var e = e || window.event;
                var el = e.toElement || e.target;
                console.log(e);
                instace.moveElement = el;

                //  获取鼠标的坐标
                var mouseX = e.pageX;
                var mouseY = e.pageY;

                //  获取元素左上角的坐标
                var elX = el.offsetLeft;
                var elY = el.offsetTop;

                //  计算出偏移量
                instace.offSetX = mouseX - elX;
                instace.offSetY = mouseY - elY;

                instace.moveElement.style.zIndex = 9000;
            });
        }
    }

    document.onmouseup = function(e){
        instace.moveElement.style.zIndex = 2;
        instace = false;
    };

    document.onmousemove = function(e){

        if(instace){

            //  获取当前鼠标坐标
            var mouseX = e.pageX;
            var mouseY = e.pageY;

            //  计算元素移动坐标
            var moveX = mouseX - instace.offSetX;
            var moveY = mouseY - instace.offSetY;

            //  计算最大移动坐标
            var maxX = document.documentElement.clientWidth  - instace.moveElement.offsetWidth;
            var maxY = document.documentElement.clientHeight - instace.moveElement.offsetHeight;

            //  设置元素的坐标
            instace.moveElement.style.left = Math.max(0,Math.min(maxX,moveX)) + 'px';
            instace.moveElement.style.top  = Math.max(0,Math.min(maxY,moveY)) + 'px';
        }
    };
</script>
</html>
```


演示地址：http://jerryc8080.github.io/dragDemo/
项目地址：https://github.com/JerryC8080/dragDemo/
