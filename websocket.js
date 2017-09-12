const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const Sequelize = require('sequelize');//加载sequelize模块
const config = require('./config');//获取数据库配置文件
//连接数据库
var sequelize=new Sequelize(config.database,config.username,config.password,{
	host:config.host,
	dialect: 'mysql',
	pool:{
		max:5,
		min:0,
		idle:30000
	}
});
//定义session表单数据模型
const sessionTable=sequelize.define('_mysql_session_store',{
	expires:{
		type:Sequelize.STRING
	},
	data:{
		type:Sequelize.STRING
	}
},{
	tableName:'_mysql_session_store',
	timestamps:false
});
//定义用户表单数据模型
const User=sequelize.define('user_account',{
	username:{
		type:Sequelize.STRING
	},
	password:{
		type:Sequelize.STRING
	}
},{
	timestamps:false
});
var WebSocketFn=async (server) => {
	let wss=new WebSocketServer({
		server:server
	});
	wss.broadcast = function broadcast(data,userId) {
        wss.clients.forEach(function each(client) {
        	if(client.readyState===1){
        		client.send(data);
        	}else{
        		console.log(client.readyState);
        	}
        });
    };
	wss.on('connection', async (ws) => {
		//建立连接根据SESSION_ID进行用户验证
		var SESSION_ID=ws.upgradeReq.url.split('?')[1];
		var sessionData=await sessionTable.findAll({
								where:{
									id:'SESSION_ID:'+SESSION_ID
								}
							});
		//验证SESSION查找结果
		if(sessionData.length!=1){
			var backJson={
				result:'failed',
				message:'连接失败:请重新登录'
			};
			ws.send(JSON.stringify(backJson), (err) => {
	            if (err) {
	                console.log(`[SERVER] error: ${err}`);
	            }
	        });
	        ws.close(4001, 'Invalid user');
	        return false;
		}
		wss.clients.forEach(function each(client) {
			let clientId='';
			if(client.userInfo){
				clientId=client.userInfo.id;
			}
			if(client.session_id==SESSION_ID || clientId==JSON.parse(sessionData[0].data).id){
				client.close(4002,'重复登录找死呢！');
			}
        });
    	createWs(ws,SESSION_ID,wss,sessionData);
	});
};
function createWs(ws,SESSION_ID,wss,sessionData,msg){
	ws.session_id=SESSION_ID;
	ws.userInfo={
		id:JSON.parse(sessionData[0].data).id,
		name:JSON.parse(sessionData[0].data).userName
	};
	ws.wss=wss;
	//添加事件响应处理方式
	ws.on('message', function(message){
	    console.log(`[SERVER] Received: ${message}`);
	    var msg=JSON.parse(message);
      	var backJson={
	        	result:'success',
				message:'连接成功!',
				root:{
					type:1,//代表广播
					loginUser:this.userInfo,
					message:msg.message,
					createTime:new Date()/1
				}
	       };
	    this.wss.broadcast(JSON.stringify(backJson));
  	});
  	ws.on('close',function (code,reason){
  		if(code==4002){//重复登录
  			return false;
	    }
  		var userList=[];
		this.wss.clients.forEach(function each(client) {
			userList.push(client.userInfo);
        });
  		var backJson={
	        	result:'success',
				message:'连接成功!',
				root:{
					type:0,//代表退出
					userList:userList,
					loginUser:this.userInfo,
					message:this.userInfo.name+'退出聊天室！',
					createTime:new Date()/1
				}
	       };
	    console.log('下线在线人数：'+wss.clients.length);
	    this.wss.broadcast(JSON.stringify(backJson));
  	});
  	
	var userList=[];
	wss.clients.forEach(function each(client) {
		if(client.readyState==1){
			userList.push(client.userInfo);
		}
    });
    var backJson={
    	result:'success',
		message:'连接成功!',
		root:{
			type:0,//代表链接
			userList:userList,
			loginUser:ws.userInfo,
			message:ws.userInfo.name+'加入聊天室！',
			createTime:new Date()/1
		}
    };
    console.log('登录在线人数：'+wss.clients.length);
	wss.broadcast(JSON.stringify(backJson));
}
module.exports = WebSocketFn;