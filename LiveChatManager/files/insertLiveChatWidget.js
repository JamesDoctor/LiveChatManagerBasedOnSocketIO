(function() {
	var widget =
		'<div id="liveChat-Widget">' +
			'<div id="liveChat-minimized">' +
				'<div id="lc-content">' +
					'<a id="lc-full-view-button" class="lc-widget-header" href="#">' +
						'<span id="lc-open-label">Chat with Customer Service</span>' +
					'</a>' +
				'</div>' +
			'</div>' +
			'<div id="liveChat-full">' +
				'<div id="lc-wrapper" class="lc-outline">' +
					'<table class="lc-content" cellspacing="0" cellpadding="0"><tbody>' +
						'<tr id="lc-title-container"><td>' +
							'<a id="lc-title-row" class="lc-widget-header" href="#">' +
								'<span id="lc-close-chat" class="lc-title-button" data-title="Close the chat">x</span>' +
								'<span id="lc-minimize" class="lc-title-button" data-title="Minimize window">-</span>' +
								'<span id="lc-title-text">Customer Service</span>' +
							'</a>' +					
						'</td></tr>' +		
						'<tr id="lc-chat-iframe"><td>' +		
							'<iframe src="http://localhost:10080/Customer?company=ABCLtd" />' +	
						'</td></tr>' +	
					'</tbody></table>' +
				'</div>' +		
			'</div>' +
		'</div>';
	$('body').append(widget);
})();