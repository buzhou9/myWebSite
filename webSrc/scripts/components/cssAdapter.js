function cssAdapter(){
	var width=window.innerWidth;
	document.getElementsByTagName('html')[0].style.fontSize=width/568*9+'px';
};
function cssAdapterCom(){
	var width=window.innerWidth;
	document.getElementsByTagName('html')[0].style.fontSize=width/320*10+'px';
};
export {cssAdapter,cssAdapterCom};
