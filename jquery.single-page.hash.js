;(function($){
	/*页面渲染容器*/
	var $container = null;
	/*系统配置项默认值*/	
	var $defaults = {
		/*容器值选择器*/
		container:'#container',
		/*默认路由*/
		defaultRoute:'index.html',
		/*默认参数*/
		defaultParams:'route',
		defaultPageRouteName : 'route',
		defaultPageTemplateUrlName : 'templateUrl',
		defaultPageCallbackName : 'page',
		/*调试模式开关*/
		debug:true,
		/*界面没有找到时需要加载的界面*/
		notFound:''
	};
	/**
	 * 缓存工厂实现
	 * {function} setItem 设置缓存
	 * {function} delItem 清除缓存
	 * {function} getItem 获得缓存
	 */
	var $cacheFactory =(function(){
		/*缓存容器*/
		var cachePool = {};
		/*发布方法*/
		return {
			/**
			 * 设置缓存
			 * {string} key 缓存的key,应保证key的长度足够端，保证查询速度
			 * {~} value 需要进行替换的数据
			 * return undefined 无返回值
			 */
			setItem:function(key,value){
				$defaults.debug && console.info('INFO:$cacheFactory.setItem-->'+' key==>'+key+','+'value==>'+value);
				cachePool[key] = value;
			},
			/**
			 * 根据key获取缓存
			 * {string} key 缓存的key
			 * return {~} 原样返回设置的值
			 */
			getItem:function(key){
				return cachePool[key];
			},
			/**
			 * 根据key删除缓存
			 * {string} key 缓存的key
			 * return {boolean} 是否删除成功
			 */
			delItem:function(key){
				delete cachePool[key];
				return key in cachePool;
			},
			/**
			 * 判断key是否在缓存中
			 * {string} key 缓存的key
			 * return {boolean} 是否存在缓存
			 */
			hasItem:function(key){
				return cachePool.hasOwnProperty(key);
			}
		};
	})();
	/**
	 * 页面工厂实现
	 * {function} addPage 添加页面
	 * {function} delPage 删除页面
	 * {function} getPage 获得页面
	 */
	var $pageFactory = (function(){
		/*页面存放的公共容器*/
		var pages = {};
		/**
		 * 向容器中添加一个页面，添加的页面立刻生效
		 * 添加的页面的结构如下：
		 * {
		 *   route:'',//路由参数，填写入element中的data-href
		 *   templateUrl:'',//页面模板所在的路径
		 *   page:function(page,args){}//页面加载完毕后执行的方法：page 当前页面的jQuery对象,args:参数
		 * }
		 */
		return {
			/**
			 * 添加一个界面
			 * {object} page 添加一个界面
			 */
			addPage:function(page){
				var route = page[$defaults.defaultPageRouteName];
				$defaults.debug && console.info('INFO:$pageFactory.addPage --> '+' add the '+route+ ' page');
				pages[route] = page;
			},
			/**
			 * 删除一个界面
			 * {string} route 页面的路由参数
			 */
			delPage:function(route){
				$defaults.debug && console.info('INFO:$pageFactory.delPage --> '+' delete the '+route+ ' page');
				delete pages[route];
				return route in pages;
			},
			/**
			 * 根据key获取一个界面
			 */
			getPage:function getPage(route){
				return pages[route];
			}
		};
	})();
	/**
	 * 路由控制器(路由参数的解析)
	 * 该函数响应hashchange事件，当hash值改变时，对hash值进行解析
	 * 解析规则如下：
	 * 如果hash值只有路由参数即：#index.html 时不在页面控制器中传
	 * 递参数，如果hash如下：#index.html&a=1&b=2时，对以&符号连接
	 * 的参数进行解析，在页面控制器中以键值对的对象形式进行注入。
	 */
	var $route = function(){
		var hash = window.location.hash;
		//将hash值进行参数转换
		var parser = function(hash){
			//替换#号之后将参数以&符号进行分割
			var arrays = hash.replace('#','').split('&');
			var result = {};
			var route = $defaults.defaultRoute ;
			//传递参数的情况对参数进行解析
			if(arrays.length > 1){
				route = arrays[0];
				var _tempArray = arrays.slice(1);
				_tempArray.length > 0 && _tempArray.forEach(function(item){
					var args = item.split('=');
					args.length==2 && (result[args[0]] = args[1]);
				});
			//不传递参数的情况
			}else if(arrays.length == 1 && arrays[0]){
				route = arrays[0];
			}
			var _rs = {
				route :route,
				params : result
			};
			$defaults.debug && console.info('INFO:$route-->'+' parse args result is:',_rs);
			return _rs;
		};
		//分发请求
		$dispatcher(parser(hash)); 
	};
	/**
	 * 分发响应器
	 * 改方法主要负责解析history中的state参数
	 * 从缓存中或者网络中加载html模板
	 * 并执行page方法
	 */
	var $dispatcher = function(args){
		//根据路由信息获取页面实例对象
		var page = $pageFactory.getPage(args.route);
		//获得当前界面的模板路径
		var templateUrl = page[$defaults.defaultPageTemplateUrlName];
		//检查页面有效性
		if(!page){ 
			$defaults.debug && console.info('ERROR:$dispatcher-->'+' the '+route+' is not found is pages');
			return;
		}
		//渲染模板并执行初始化方法
		var callback = function(template){
			$container.html(template);
			if(page.hasOwnProperty($defaults.defaultPageCallbackName)){
				page[$defaults.defaultPageCallbackName].call(this,args.params);
			}else{
				$defaults.debug && console.info('ERROR:$dispatcher-->'+' method named '+$defaults.defaultPageCallbackName+' in '+route+' page is not found');return;
			}
		};
		//加载模板
		var template = $cacheFactory.getItem(templateUrl);
		if(template){
			$defaults.debug && console.info('INFO:$dispatcher-->'+' get template('+templateUrl+') from the cacheFactory');
			callback(template);
		}else{
			$defaults.debug && console.info('INFO:$dispatcher-->'+' get template('+templateUrl+') from the internet');
			$.get(templateUrl,callback);
		}
	
	};
	//发布方法
	$.fn.extend({
		spa:function(config){
			$container = $(this);
			$defaults = $.extend($defaults,config || {});
			window.onhashchange = $route;
			$route();
		}
	});
	//发布方法
	$.extend({
		page:$pageFactory.addPage
	});
	
})(jQuery);
	
	