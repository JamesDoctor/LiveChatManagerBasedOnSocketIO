(function() {
	function setupLiveChat() {
		var socket = null;
		var CHAT_MSG = "chat message";
		var DISCONNECT = "disconnect";
		var CONNECT_TO_SERVER = "connectServer";
		var SERVER_ACKNOWLEDGED_CONNECT = "serverAcqConn";
		var FAIL_CONNECT_COMPANY_AGENT = 'failConnectCompanyAgent'
		var COMPANY = "{LIVE_CHAT_COMPANY}";
		var selectors = {
			CHAT_RECORDS : "#lc-chatRecords",
			START_CHAT_CONTAINER : "#lc-startChat-container",
			SEND_MESSAGE_CONTAINER : "#lc-sendMessage-container",
			START_CHAT_BTN : ".lc-startChatBtn",
			SEND_MSG_BTN : ".lc-sendMessageBtn",
			INPUT_MSG : ".lc-inputMessage"
		};
		
		var styles = {
			VISIBILITY : "visibility",
			VISIBLE : "visible",
			HIDDEN : "hidden"
		};
		
		function startCommunication() {
			if (socket) {
				return;
			}
			
			socket = io();
			if (!socket) {
				appendChatRecord("Fail to connect to Customer Service");
				return;
			}
			
			socket.emit(CONNECT_TO_SERVER, COMPANY);
			
			socket.on(SERVER_ACKNOWLEDGED_CONNECT, function() {
				appendChatRecord("Connected to Customer Service.");
				toggleChatContoller();
			});
			
			socket.on(FAIL_CONNECT_COMPANY_AGENT, function() {
				socket = null;
				appendChatRecord("Failed to connect " + COMPANY + " agent. Please try again.");
				toggleChatContoller();
			});
					
			socket.on(CHAT_MSG, function(msg){
				if (msg) {
					console.log(msg);
					appendChatRecord(msg);
				}
			}); 
			
			socket.on(DISCONNECT, function(){
				socket = null;
				appendChatRecord("Chat closed! Please reload this page");
				hideChatContoller();
			});
		}
		
		function appendChatRecord(message) {
			if (message) {
				$(selectors.CHAT_RECORDS).append("<div class='lc-chatMessage'>" + message + "</div>");
				$(selectors.CHAT_RECORDS)[0].scrollTop = $(selectors.CHAT_RECORDS)[0].scrollHeight;
			}
		}
		
		function toggleWidget(fullView, minimizedView) {
			var fullViewStyle = fullView ? styles.VISIBLE : styles.HIDDEN;
			var minimizedViewStyle = minimizedView ? styles.VISIBLE : styles.HIDDEN;
			$(selectors.CHAT_MIN).css(styles.VISIBILITY, minimizedViewStyle);
			$(selectors.CHAT_FULL).css(styles.VISIBILITY, fullViewStyle);
		}
		
		function hideChatContoller() {
			$(selectors.START_CHAT_CONTAINER).css(styles.VISIBILITY, styles.HIDDEN);
			$(selectors.SEND_MESSAGE_CONTAINER).css(styles.VISIBILITY, styles.HIDDEN);
		}
		
		function toggleChatContoller() {
			var startChatStyle = (!socket) ? styles.VISIBLE : styles.HIDDEN;
			var sendMsgStyle = socket ? styles.VISIBLE : styles.HIDDEN;
			$(selectors.START_CHAT_CONTAINER).css(styles.VISIBILITY, startChatStyle);
			$(selectors.SEND_MESSAGE_CONTAINER).css(styles.VISIBILITY, sendMsgStyle);
		}
		
		$(document).on("click", selectors.START_CHAT_BTN, function() {
			startCommunication();
		});
		
		$(document).on("click", selectors.SEND_MSG_BTN, function() {
			var msg = $(selectors.INPUT_MSG)[0].value;
			if (msg) {
				socket.emit(CHAT_MSG, msg);
				appendChatRecord("Me: " + msg);
				$(selectors.INPUT_MSG)[0].value = "";
			}
		});
	}
	
	setupLiveChat();
})();