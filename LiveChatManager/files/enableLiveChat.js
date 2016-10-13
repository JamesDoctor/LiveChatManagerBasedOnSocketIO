(function() {	
	function insertJS(src) {
	  var lc = document.createElement('script');
	  lc.type = 'text/javascript';
	  lc.async = false;
	  lc.src = src;
	  document.body.appendChild(lc);
	}

	function insertCSS(src) {
	  var lc = document.createElement('link');
	  lc.rel = 'stylesheet';
	  lc.type = 'text/css';
	  lc.href = src;
	  var head = document.getElementsByTagName("head")[0];
	  head.appendChild(lc);
	}
	
	insertJS('http://localhost:10082/Files?file=jquery-3.1.1.js');
	insertCSS('http://localhost:10082/Files?file=customerLiveChatWidgetIFrame.css');
	insertJS('http://localhost:10082/Files?file=insertLiveChatWidget.js');
	insertJS('http://localhost:10082/Files?file=clientLiveChatWidgetIFrame.js');
})();