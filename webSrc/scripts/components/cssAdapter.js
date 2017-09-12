function cssAdapter(){
	var width=window.innerWidth;
	document.getElementsByTagName('html')[0].style.fontSize=width/568*9+'px';
}
export {cssAdapter};
