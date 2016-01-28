;(function($){
	/*ҳ����Ⱦ����*/
	var $container = null;
	/*ϵͳ������Ĭ��ֵ*/	
	var $defaults = {
		/*����ֵѡ����*/
		container:'#container',
		/*Ĭ��·��*/
		defaultRoute:'index.html',
		/*Ĭ�ϲ���*/
		defaultParams:'route',
		defaultPageRouteName : 'route',
		defaultPageTemplateUrlName : 'templateUrl',
		defaultPageCallbackName : 'page',
		/*����ģʽ����*/
		debug:true,
		/*����û���ҵ�ʱ��Ҫ���صĽ���*/
		notFound:''
	};
	/**
	 * ���湤��ʵ��
	 * {function} setItem ���û���
	 * {function} delItem �������
	 * {function} getItem ��û���
	 */
	var $cacheFactory =(function(){
		/*��������*/
		var cachePool = {};
		/*��������*/
		return {
			/**
			 * ���û���
			 * {string} key �����key,Ӧ��֤key�ĳ����㹻�ˣ���֤��ѯ�ٶ�
			 * {~} value ��Ҫ�����滻������
			 * return undefined �޷���ֵ
			 */
			setItem:function(key,value){
				$defaults.debug && console.info('INFO:$cacheFactory.setItem-->'+' key==>'+key+','+'value==>'+value);
				cachePool[key] = value;
			},
			/**
			 * ����key��ȡ����
			 * {string} key �����key
			 * return {~} ԭ���������õ�ֵ
			 */
			getItem:function(key){
				return cachePool[key];
			},
			/**
			 * ����keyɾ������
			 * {string} key �����key
			 * return {boolean} �Ƿ�ɾ���ɹ�
			 */
			delItem:function(key){
				delete cachePool[key];
				return key in cachePool;
			},
			/**
			 * �ж�key�Ƿ��ڻ�����
			 * {string} key �����key
			 * return {boolean} �Ƿ���ڻ���
			 */
			hasItem:function(key){
				return cachePool.hasOwnProperty(key);
			}
		};
	})();
	/**
	 * ҳ�湤��ʵ��
	 * {function} addPage ���ҳ��
	 * {function} delPage ɾ��ҳ��
	 * {function} getPage ���ҳ��
	 */
	var $pageFactory = (function(){
		/*ҳ���ŵĹ�������*/
		var pages = {};
		/**
		 * �����������һ��ҳ�棬��ӵ�ҳ��������Ч
		 * ��ӵ�ҳ��Ľṹ���£�
		 * {
		 *   route:'',//·�ɲ�������д��element�е�data-href
		 *   templateUrl:'',//ҳ��ģ�����ڵ�·��
		 *   page:function(page,args){}//ҳ�������Ϻ�ִ�еķ�����page ��ǰҳ���jQuery����,args:����
		 * }
		 */
		return {
			/**
			 * ���һ������
			 * {object} page ���һ������
			 */
			addPage:function(page){
				var route = page[$defaults.defaultPageRouteName];
				$defaults.debug && console.info('INFO:$pageFactory.addPage --> '+' add the '+route+ ' page');
				pages[route] = page;
			},
			/**
			 * ɾ��һ������
			 * {string} route ҳ���·�ɲ���
			 */
			delPage:function(route){
				$defaults.debug && console.info('INFO:$pageFactory.delPage --> '+' delete the '+route+ ' page');
				delete pages[route];
				return route in pages;
			},
			/**
			 * ����key��ȡһ������
			 */
			getPage:function getPage(route){
				return pages[route];
			}
		};
	})();
	/**
	 * ·�ɿ�����(·�ɲ����Ľ���)
	 * �ú�����Ӧhashchange�¼�����hashֵ�ı�ʱ����hashֵ���н���
	 * �����������£�
	 * ���hashֵֻ��·�ɲ�������#index.html ʱ����ҳ��������д�
	 * �ݲ��������hash���£�#index.html&a=1&b=2ʱ������&��������
	 * �Ĳ������н�������ҳ����������Լ�ֵ�ԵĶ�����ʽ����ע�롣
	 */
	var $route = function(){
		var hash = window.location.hash;
		//��hashֵ���в���ת��
		var parser = function(hash){
			//�滻#��֮�󽫲�����&���Ž��зָ�
			var arrays = hash.replace('#','').split('&');
			var result = {};
			var route = $defaults.defaultRoute ;
			//���ݲ���������Բ������н���
			if(arrays.length > 1){
				route = arrays[0];
				var _tempArray = arrays.slice(1);
				_tempArray.length > 0 && _tempArray.forEach(function(item){
					var args = item.split('=');
					args.length==2 && (result[args[0]] = args[1]);
				});
			//�����ݲ��������
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
		//�ַ�����
		$dispatcher(parser(hash)); 
	};
	/**
	 * �ַ���Ӧ��
	 * �ķ�����Ҫ�������history�е�state����
	 * �ӻ����л��������м���htmlģ��
	 * ��ִ��page����
	 */
	var $dispatcher = function(args){
		//����·����Ϣ��ȡҳ��ʵ������
		var page = $pageFactory.getPage(args.route);
		//��õ�ǰ�����ģ��·��
		var templateUrl = page[$defaults.defaultPageTemplateUrlName];
		//���ҳ����Ч��
		if(!page){ 
			$defaults.debug && console.info('ERROR:$dispatcher-->'+' the '+route+' is not found is pages');
			return;
		}
		//��Ⱦģ�岢ִ�г�ʼ������
		var callback = function(template){
			$container.html(template);
			if(page.hasOwnProperty($defaults.defaultPageCallbackName)){
				page[$defaults.defaultPageCallbackName].call(this,args.params);
			}else{
				$defaults.debug && console.info('ERROR:$dispatcher-->'+' method named '+$defaults.defaultPageCallbackName+' in '+route+' page is not found');return;
			}
		};
		//����ģ��
		var template = $cacheFactory.getItem(templateUrl);
		if(template){
			$defaults.debug && console.info('INFO:$dispatcher-->'+' get template('+templateUrl+') from the cacheFactory');
			callback(template);
		}else{
			$defaults.debug && console.info('INFO:$dispatcher-->'+' get template('+templateUrl+') from the internet');
			$.get(templateUrl,callback);
		}
	
	};
	//��������
	$.fn.extend({
		spa:function(config){
			$container = $(this);
			$defaults = $.extend($defaults,config || {});
			window.onhashchange = $route;
			$route();
		}
	});
	//��������
	$.extend({
		page:$pageFactory.addPage
	});
	
})(jQuery);
	
	