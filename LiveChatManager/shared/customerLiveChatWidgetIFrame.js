(function() {
	var selectors = {
		CHAT_WIDGET : "#liveChat-Widget",
		CHAT_MIN : "#liveChat-minimized",
		CHAT_FULL : "#liveChat-full",
		FULL_VIEW_BTN : "#lc-full-view-button",
		MIN_VIEW_BTN : "#lc-minimize",
		CLOSE_CHAT_BTN : "#lc-close-chat",
		BODY : "body"
	};
	
	var styles = {
		VISIBILITY : "visibility",
		VISIBLE : "visible",
		HIDDEN : "hidden"
	};
	
	function toggleWidget(fullView, minimizedView) {
		var fullViewStyle = fullView ? styles.VISIBLE : styles.HIDDEN;
		var minimizedViewStyle = minimizedView ? styles.VISIBLE : styles.HIDDEN;
		$(selectors.CHAT_MIN).css(styles.VISIBILITY, minimizedViewStyle);
		$(selectors.CHAT_FULL).css(styles.VISIBILITY, fullViewStyle);
	}
	
	$(selectors.BODY).on("click", selectors.FULL_VIEW_BTN, function() {
		toggleWidget(true, false);
	});
	
	$(selectors.BODY).on("click", selectors.MIN_VIEW_BTN, function() {
		toggleWidget(false, true);
	});
	
	$(selectors.BODY).on("click", selectors.CLOSE_CHAT_BTN, function() {
		$(selectors.CHAT_WIDGET).remove();
	});
})();