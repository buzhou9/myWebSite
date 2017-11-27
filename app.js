'use strict';
const path = require('path');//路径系统模块
const fs = require('fs');//文件系统模块
const url = require('url');//路径化模块
const Koa=require("koa");//引入web服务器框架
const mime = require('mime');//识别文件类型的模块
const router = require('koa-router')();//引入路由模块
const bodyParser = require('koa-bodyparser');//引入分析原始request请求的中间件
const controller = require('./controller');//路由批量加载方法
const session = require('./session.js');
const WebSocketFn = require('./websocket.js');
const app=new Koa();
app.use( async (ctx,next) => {
	console.log('这是入口'+ctx.request.method+'   '+ctx.request.url);
	var pathname=ctx.request.path;
	var urlStr='/webRoot/';
	var webRoot=path.resolve('webRoot');
	if(!pathname.startsWith('/server/')){
		if(pathname=='/index.html' || pathname=='/'){
			pathname='/build/views/index.html';
			ctx.redirect('/build/views/index.html');
		}
		var filepath=path.join(webRoot,pathname);
		ctx.response.type = mime.lookup(pathname);
		ctx.response.body = fs.createReadStream(filepath);
	}
	await next();
});
app.use(session());
app.use(bodyParser());
app.use(controller());

let server = app.listen(8083);
WebSocketFn(server);//开启WebSocket服务
console.log('app started at port 8083');
