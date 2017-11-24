const Sequelize = require('sequelize');
const config = require('../config');
const moment = require('moment');//时间格式转换工具
var sequelize=new Sequelize(config.database,config.username,config.password,{
	host:config.host,
	dialect: 'mysql',
	pool:{
		max:5,
		min:0,
		idle:30000
	}
});
sequelize.authenticate().then(()=>{
	console.log('Connection has been established successfully.');
})
.catch(err => {
	 console.error('Unable to connect to the database:', err);
});
const User=sequelize.define('user_account',{
	username:{
		type:Sequelize.STRING
	},
	password:{
		type:Sequelize.STRING
	},
	nickname:{
		type:Sequelize.STRING
	},
	headPic:{
		type:Sequelize.STRING
	},
	age:{
		type:Sequelize.STRING
	},
	createData:{
		type:Sequelize.DATE
	}
},{
	timestamps:false
});
const LoginRecord=sequelize.define('user_loginRecords',{
	userId:{
		type:Sequelize.BIGINT
	},
	username:{
		type:Sequelize.STRING
	},
	loginTime:{
		type:Sequelize.DATE
	},
	loginIp:{
		type:Sequelize.STRING
	}
},{
	timestamps:false
});
//定义session数据库
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
var fn_login = async (ctx, next) => {
	let form={};
	ctx.method=='GET'?form=ctx.query:form=ctx.request.body;
	try{//查询账号是否存在
		let p=await User.findAll({
			where:{
				username:form.userName
			}
		});
		if(p.length==0){
			let backJson={
				result:"failed",
				message:"用户不存在！"
			};
			ctx.response.body=JSON.stringify(backJson);
		}else{//如果查询账号存在
			let JsonP=p[0];
			if(JsonP.password==form.password){//判断密码是否正确
				try{//添加登录记录
					let createResult=await LoginRecord.create({
						loginIp:get_ip(ctx.request),
						userId:JsonP.id,
						username:form.userName,
						loginTime:moment()
					});
					let backJson={
						result:"success",
						message:"登录成功！"
					};
					ctx.session = JsonP.dataValues;//设置session
					ctx.response.body =JSON.stringify(backJson);
				}catch(e){
					console.log(e);
					let backJson={
						result:"failed",
						message:"登录失败！"
					}
					ctx.response.body=JSON.stringify(backJson);
				}
			}else{
				let backJson={
					result:"failed",
					message:"密码错误！"
				};
				ctx.response.body=JSON.stringify(backJson);
			}
		}
		
	}catch(e){
		console.log(e);
		let backJson={
			result:"failed",
			message:"登录失败！"
		}
		ctx.response.body=JSON.stringify(backJson);
	}
};
var fn_signOut = async (ctx,next) => {
	let SESSION_ID = ctx.cookies.get('SESSION_ID');
	if(SESSION_ID != undefined){
		try{
			let result=await sessionTable.findAll({
				where:{
					id:'SESSION_ID:'+SESSION_ID
				}
			});
			if(result.length>0){
				let expires = result[0].expires;//验证session是否过期
				expires = new Date(expires/1);
				var nowTime=new Date();
				if(expires>nowTime){
					try{
						result[0].expires = (nowTime/1).toString();
						await result[0].save();
						let backJson={
							result:"success",
							message:"退出成功！",
							state:3
						}
						ctx.cookies.set(
					      'SESSION_ID',
					      '',{
					        	expires:new Date(2000,1,1),  // cookie失效时间
					      }
					   	);
						ctx.response.body=JSON.stringify(backJson);
					}catch(e){
						console.log(e);
						let backJson={
							result:"failed",
							message:"服务器修改失败！",
							state:01
						}
						ctx.response.body=JSON.stringify(backJson);
					}
				}else{
					let backJson={
						result:"success",
						message:"登录信息已过期！",
						state:3
					}
					ctx.response.body=JSON.stringify(backJson);
				}
			}else{
				let backJson={
					result:"failed",
					message:"无效session！",
					state:2
				}
				ctx.response.body=JSON.stringify(backJson);
			}
		}catch(e){
			console.log(e);
			let backJson={
				result:"failed",
				message:"服务器查询失败！",
				state:01
			}
			ctx.response.body=JSON.stringify(backJson);
		}
	}else{
		let backJson={
			result:"failed",
			message:"无session！",
			state:1
		}
		ctx.response.body=JSON.stringify(backJson);
	}
}
var fn_register = async (ctx, next) => {
	let form={};
	ctx.method=='GET'?form=ctx.query:form=ctx.request.body;
	try{
		let p=await User.findAll({
			where:{
				username:form.userName
			}
		});
		if(p.length==0){
			try{
				let p=await User.create({
					username:form.userName,
					password:form.password
				});
				let backJson={
					result:"success",
					message:"注册成功！"
				}
				ctx.response.body=JSON.stringify(backJson);
			}catch(e){
				console.log(e);
				let backJson={
					result:"failed",
					message:"服务器异常！"
				}
				ctx.response.body=JSON.stringify(backJson);
			}
		}else{
			let backJson={
				result:"failed",
				message:"账户已存在！"
			}
			ctx.response.body=JSON.stringify(backJson);
		}
	}catch(e){
		console.log(e);
		let backJson={
			result:"failed",
			message:"服务器异常！"
		}
		ctx.response.body=JSON.stringify(backJson);
	}
};
var fn_searchAccount = async (ctx, next) => {
	let form={};
	ctx.method=='GET'?form=ctx.query:form=ctx.request.body;
	if(form.userName==undefined){
		console.log(form)
		let backJson={
			result:"failed",
			message:"缺少参数！"
		}
		ctx.response.body=JSON.stringify(backJson);
	}else{
		let p=[];
		try{
			p=await User.findAll({
				where:{
					username:form.userName
				}
			});
		}catch(e){
			console.log(e);
			let backJson={
				result:"failed",
				message:"服务器查询失败！"
			}
			ctx.response.body=JSON.stringify(backJson);
		}
		if(p.length==0){
			let backJson={
				result:"success",
				message:"没有这个账号！",
				root:true
			}
			ctx.response.body=JSON.stringify(backJson);
		}else{
			let backJson={
				result:"success",
				message:"账户已存在！",
				root:false
			}
			ctx.response.body=JSON.stringify(backJson);
		}
	}
};
var fn_searchSession = async (ctx, next) => {
	let m = await checkSession(ctx, next);
	m==undefined?m={}:true;
	if(m.result=='success'){
		ctx.response.body=JSON.stringify(m);
	}
}
var checkSession = async (ctx, next) =>{
	let SESSION_ID = ctx.cookies.get('SESSION_ID');
	if(SESSION_ID != undefined){
		try{
			let result=await sessionTable.findAll({
				where:{
					id:'SESSION_ID:'+SESSION_ID
				}
			});
			if(result.length>0){
				let expires = result[0].expires;//验证session是否过期
				expires = new Date(expires/1);
				var nowTime=new Date();
				if(expires>nowTime){
					return {
						result:"success",
						message:"登录信息有效！",
						root:JSON.parse(result[0].data)
					};
				}else{
					let backJson={
						result:"failed",
						message:"登录信息已过期！",
						state:3
					}
					ctx.response.body=JSON.stringify(backJson);
				}
			}else{
				let backJson={
					result:"failed",
					message:"无效session！",
					state:2
				}
				ctx.response.body=JSON.stringify(backJson);
			}
		}catch(e){
			console.log(e);
			let backJson={
				result:"failed",
				message:"服务器查询失败！",
				state:01
			}
			ctx.response.body=JSON.stringify(backJson);
		}
	}else{
		let backJson={
			result:"failed",
			message:"无session！",
			state:1
		}
		ctx.response.body=JSON.stringify(backJson);
	}
}
var get_ip = function(req) {
	    var ip = req.headers['x-real-ip'] || 
	             req.headers['x-forwarded-for'] ||
	             req.socket.remoteAddress || '';
	    if(ip.split(',').length>0){
	        ip = ip.split(',')[0];
	    }
	    return ip;
	};
module.exports = {
    'GET /server/user/login':fn_login,
    'POST /server/user/login':fn_login,
    'GET /server/user/register':fn_register,
    'POST /server/user/register':fn_register,
    'GET /server/user/searchAccount':fn_searchAccount,
    'POST /server/user/searchAccount':fn_searchAccount,
    'GET /server/user/searchSession':fn_searchSession,
    'POST /server/user/searchSession':fn_searchSession,
    'GET /server/user/signOut':fn_signOut,
    'POST /server/user/signOut':fn_signOut
};