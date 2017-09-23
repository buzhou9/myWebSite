import '../../styles/common/style.css';
import '../../styles/common/font_icon.css';
import '../../styles/page/index.css';
import {cssAdapterCom} from '../components/cssAdapter.js';

cssAdapterCom();
const pageResize=function(){
	cssAdapterCom();
	let headerBg=document.getElementById('header-bg');
	let parent=headerBg.parentNode;
	var str='?x-oss-process=image/resize,m_fill,h_'+parent.clientHeight+',w_'+parent.clientWidth;
	headerBg.src=headerBg.getAttribute('asrc')+str;
};
pageResize();
window.onresize=pageResize;


{
	let openLogin=document.getElementById('open-login');
	let loginBg=document.querySelector('.login-bg');
	openLogin.addEventListener('tap',function(){
		loginBg.style.display='block';
	});
	document.getElementById('login-bg-close').addEventListener('tap',function(){
		loginBg.style.display='none';
	});
	document.getElementById('login-sub').addEventListener('tap',function(){
		//获取表单数据
		var form={
			userName:document.getElementById('userName-val').value,
			password:document.getElementById('password-val').value
		};
		var re=/\S/;
		if(!re.test(form.userName)){
			alert('用户名不能为空！');
			return false;
		}
		if(!re.test(form.password)){
			alert('用户名不能为空！');
			return false;
		}
		mui.ajax('/server/user/login',{
			data:form,
			dataType:'json',//服务器返回json格式数据
			type:'post',//HTTP请求类型
			success:function(data){
				console.log(data);
				if(data.result=='success'){
					
				}else{
					alert(data.message);
				}
			},
			error:function(xhr,type,errorThrown){
				
			}
		});
	});
};
