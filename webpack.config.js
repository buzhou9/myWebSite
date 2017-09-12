var path = require('path');
var glob = require('glob');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

var entries = getEntry('webSrc/scripts/page/**/*.js','webSrc/scripts/page/');
var chunks = Object.keys(entries); 
console.log(entries);
var config = {
	entry: entries,
    output: { 
        path:path.resolve(__dirname, 'webRoot/build'), //输出目录的配置，模板、样式、脚本、图片等资源的路径配置都相对于它
       // publicPath:'../', // 所有静态资源的连接都会加上这里写的固定目录，如果不设置publicPath的值，打包的时候会自动生成相对路径
        filename: 'js/[name].js',            //每个页面对应的主js的生成配置
        chunkFilename: 'js/[id].chunk.js'   //chunk生成的配置
    },
    module: {
        loaders: [ //加载器，关于各个加载器的参数配置，可自行搜索之。
            {
                test: /\.css$/,
                //配置css的抽取器、加载器。'-loader'可以省去
                loader: ExtractTextPlugin.extract('css-loader', 'style-loader') 
            }, {
                test: /\.less$/,
                //配置less的抽取器、加载器。中间!有必要解释一下，
                //根据从右到左的顺序依次调用less、css加载器，前一个的输出是后一个的输入
                //你也可以开发自己的loader哟。有关loader的写法可自行谷歌之。
                loader: ExtractTextPlugin.extract('css!less')
            }, {
                test: /\.scss$/,
                //配置less的抽取器、加载器。中间!有必要解释一下，
                //根据从右到左的顺序依次调用less、css加载器，前一个的输出是后一个的输入
                //你也可以开发自己的loader哟。有关loader的写法可自行谷歌之。
                loader: ExtractTextPlugin.extract('css-loader','sass-loader')
            },{
		        test: /\.(png|jpe?g|gif)$/,
		        loader: 'url-loader?limit=8192&name=[name].[ext]&outputPath=img/&publicPath=../'
		    },{
		        test: /\.html$/,
		        loader: 'html-loader' // 避免压缩html,https://github.com/webpack/html-loader/issues/50
		    },{
		        test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
		        loader: 'file-loader?name=[name].[ext]&outputPath=fonts/&publicPath=../'
		    }
        ]
    },
    devServer: {
    	proxy: {
	         '/server/': {
	             target: 'http://192.168.1.20:8083',
	             secure: false,
	             changeOrigin: true,
	             pathRewrite: {'^/api': ''}
	         }
	    },
      	contentBase: './webRoot/',
      	host:"127.0.0.1",
      	port:8081,
      	overlay:{
      		errors:true,
      		warnings:true
      	},
      	compress:true,
      	hot:true
    },
    plugins: [
        new webpack.ProvidePlugin({ //加载jq
            $: 'jquery'
        }),
        new CleanWebpackPlugin(['webRoot/build']),
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendors', // 将公共模块提取，生成名为`vendors`的chunk
            chunks: chunks, //提取哪些模块共有的部分
            minChunks: chunks.length// 提取至少3个模块共有的部分
        }),
        new ExtractTextPlugin('css/[name].css'), //单独使用link标签加载css并设置路径，相对于output配置中的publickPath
   		new webpack.HotModuleReplacementPlugin() //热加载
    ]
};

var pages = Object.keys(getEntry('webSrc/views/**/*.html', 'webSrc/views/'));
console.log(pages);
pages.forEach(function (pathname) {
	var conf = {
	    filename:'views/'+pathname + '.html', // 生成的html存放路径，相对于path
	    template: 'webSrc/views/' + pathname + '.html', // html模板路径
	    inject: false // js插入的位置，true/'head'/'body'/false
	    /*
	     * 压缩这块，调用了html-minify，会导致压缩时候的很多html语法检查问题，
	     * 如在html标签属性上使用{{...}}表达式，很多情况下并不需要在此配置压缩项，
	     * 另外，UglifyJsPlugin会在压缩代码的时候连同html一起压缩。
	     * 为避免压缩html，需要在html-loader上配置'html?-minimize'，见loaders中html-loader的配置。
	     */
	    // minify: { //压缩HTML文件
	    //  removeComments: true, //移除HTML中的注释
	    //  collapseWhitespace: false //删除空白符与换行符
	    // }
	}
	if (pathname in config.entry) {
	    conf.inject = 'body'
	    conf.chunks = ['vendors', pathname]
	}
	config.plugins.push(new HtmlWebpackPlugin(conf));
});
module.exports = config;


function getEntry(globPath, pathDir) {
    var files = glob.sync(globPath)
	var entries = {}, entry, dirname, basename, pathname, extname
	
	  for (var i = 0; i < files.length; i++) {
	    entry = files[i]
	    dirname = path.dirname(entry)
	    extname = path.extname(entry)
	    basename = path.basename(entry, extname)
	    pathname = path.normalize(path.join(dirname, basename))
	    pathDir = path.normalize(pathDir)
	    if (pathname.startsWith(pathDir)) {
	      pathname = pathname.substring(pathDir.length)
	    }
	    entries[pathname] = ['./' + entry]
	}
    return entries;
}