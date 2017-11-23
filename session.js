module.exports = function () {
		const config = require('./config');
		const session = require('koa-session-minimal');
		const MysqlSession = require('koa-mysql-session');
		let store = new MysqlSession({
		  user:config.username,
		  password:config.password,
		  database:config.database,
		  host:config.host
		})
		let cookie = {
		  maxAge:0, // cookie有效时长
		  expires: '',  // cookie失效时间
		  path: '/', // 写cookie所在的路径
		  domain: '', // 写cookie所在的域名
		  httpOnly: '', // 是否只用于http请求中获取
		  overwrite:'',  // 是否允许重写
		  secure: '',
		  sameSite: '',
		  signed: ''
		}
    return session({
				key:'SESSION_ID',
				store:store,
				cookie:cookie
			});
};