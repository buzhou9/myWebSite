var fn_index = async (ctx, next) => {
	ctx.redirect('/build/views/index.html');
};
module.exports = {
    'GET /':fn_index,
    'POST /':fn_index
};