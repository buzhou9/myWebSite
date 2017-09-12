const Sequelize = require('sequelize');
const config = require('../config');
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
	}
},{
	timestamps:false
});
var fn_login = async (ctx, next) => {
	var form=ctx.request.body;
	console.log(form);
	var p=await User.findAll({
				where:{
					username:form.userName
				}
		});
	console.log('查到的数据条数：'+p.length);
	if(p.length==0){
		var backJson={
			result:"failed",
			message:"用户不存在！"
		};
		ctx.response.body=JSON.stringify(backJson);
	}else{
		var JsonP=p[0];
		if(JsonP.password==form.password){
			var backJson={
				result:"success",
				message:"登录成功！"
			};
			ctx.cookies.set('view', 'qwewqe');
			ctx.session = {
				id:JsonP.id,
				userName:JsonP.username,
				password:JsonP.password
			}
			ctx.response.body =JSON.stringify(backJson);
		}else{
			var backJson={
				result:"failed",
				message:"密码错误！"
			};
			ctx.response.body=JSON.stringify(backJson);
		}
	}
};
var fn_register = async (ctx, next) => {
	var form=ctx.request.body;
	console.log(form);
	var p=await User.findAll({
		where:{
			username:form.userName
		}
	});
	if(p.length==0){
		var p=await User.create({
			username:form.userName,
			password:form.password
		});
		var backJson={
			result:"success",
			message:"注册成功！"
		}
		ctx.response.body=JSON.stringify(backJson);
	}else{
		var backJson={
			result:"failed",
			message:"账户已存在！"
		}
		ctx.response.body=JSON.stringify(backJson);
	}
};
module.exports = {
    'GET /server/user/login':fn_login,
    'POST /server/user/login':fn_login,
    'GET /server/user/register':fn_register,
    'POST /server/user/register':fn_register
};