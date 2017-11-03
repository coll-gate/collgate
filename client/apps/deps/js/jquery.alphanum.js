/********************************************************************
* Limit the characters that may be entered in a text field
* Common options: alphanumeric, alphabetic or numeric
* Kevin Sheedy, 2012
* http://github.com/KevinSheedy/jquery.alphanum
*********************************************************************/
(function( $ ){

	// API ///////////////////////////////////////////////////////////////////
	$.fn.alphanum = function(settings) {

		let combinedSettings = getCombinedSettingsAlphaNum(settings);

		let $collection = this;

		setupEventHandlers($collection, trimAlphaNum, combinedSettings);

		return this;
	};

	$.fn.alpha = function(settings) {

		let defaultAlphaSettings = getCombinedSettingsAlphaNum("alpha");
		let combinedSettings = getCombinedSettingsAlphaNum(settings, defaultAlphaSettings);

		let $collection = this;

		setupEventHandlers($collection, trimAlphaNum, combinedSettings);

		return this;
	};

	$.fn.numeric = function(settings) {

		let combinedSettings = getCombinedSettingsNum(settings);
		let $collection = this;

		setupEventHandlers($collection, trimNum, combinedSettings);

		$collection.blur(function(){
			numericField_Blur(this, combinedSettings);
		});

		return this;
	};

	// End of API /////////////////////////////////////////////////////////////


	// Start Settings ////////////////////////////////////////////////////////

	let DEFAULT_SETTINGS_ALPHANUM = {
		allow              : '',    // Allow extra characters
		disallow           : '',    // Disallow extra characters
		allowSpace         : true,  // Allow the space character
		allowNewline       : true,  // Allow the newline character \n ascii 10
		allowNumeric       : true,  // Allow digits 0-9
		allowUpper         : true,  // Allow upper case characters
		allowLower         : true,  // Allow lower case characters
		allowCaseless      : true,  // Allow characters that don't have both upper & lower variants - eg Arabic or Chinese
		allowLatin         : true,  // a-z A-Z
		allowOtherCharSets : true,  // eg é, Á, Arabic, Chinese etc
		forceUpper         : false, // Convert lower case characters to upper case
		forceLower         : false, // Convert upper case characters to lower case
		maxLength          : NaN    // eg Max Length
	}

	let DEFAULT_SETTINGS_NUM = {
		allowPlus           : false, // Allow the + sign
		allowMinus          : true,  // Allow the - sign
		allowThouSep        : true,  // Allow the thousands separator, default is the comma eg 12,000
		allowDecSep         : true,  // Allow the decimal separator, default is the fullstop eg 3.141
		allowLeadingSpaces  : false,
		maxDigits           : NaN,   // The max number of digits
		maxDecimalPlaces    : NaN,   // The max number of decimal places
		maxPreDecimalPlaces : NaN,   // The max number digits before the decimal point
		max                 : NaN,   // The max numeric value allowed
		min                 : NaN    // The min numeric value allowed
	}

	// Some pre-defined groups of settings for convenience
	let CONVENIENCE_SETTINGS_ALPHANUM = {
		"alpha" : {
			allowNumeric  : false
		},
		"upper" : {
			allowNumeric  : false,
			allowUpper    : true,
			allowLower    : false,
			allowCaseless : true
		},
		"lower" : {
			allowNumeric  : false,
			allowUpper    : false,
			allowLower    : true,
			allowCaseless : true
		}
	};

	// Some pre-defined groups of settings for convenience
	let CONVENIENCE_SETTINGS_NUMERIC = {
		"integer" : {
			allowPlus    : false,
			allowMinus   : true,
			allowThouSep : false,
			allowDecSep  : false
		},
		"positiveInteger" : {
			allowPlus    : false,
			allowMinus   : false,
			allowThouSep : false,
			allowDecSep  : false
		}
	};


	let BLACKLIST   = getBlacklistAscii() + getBlacklistNonAscii();
	let THOU_SEP    = ",";
	let DEC_SEP     = ".";
	let DIGITS      = getDigitsMap();
	let LATIN_CHARS = getLatinCharsSet();

	// Return the blacklisted special chars that are encodable using 7-bit ascii
	function getBlacklistAscii(){
		let blacklist = '!@#$%^&*()+=[]\\\';,/{}|":<>?~`.-_';
		blacklist += " "; // 'Space' is on the blacklist but can be enabled using the 'allowSpace' config entry
		return blacklist;
	}

	// Return the blacklisted special chars that are NOT encodable using 7-bit ascii
	// We want this .js file to be encoded using 7-bit ascii so it can reach the widest possible audience
	// Higher order chars must be escaped eg "\xAC"
	// Not too worried about comments containing higher order characters for now (let's wait and see if it becomes a problem)
	function getBlacklistNonAscii(){
		let blacklist =
			  "\xAC"     // ¬
			+ "\u20AC"   // €
			+ "\xA3"     // £
			+ "\xA6"     // ¦
			;
		return blacklist;
	}

	// End Settings ////////////////////////////////////////////////////////


	// Implementation details go here ////////////////////////////////////////////////////////

	function setupEventHandlers($textboxes, trimFunction, settings) {

		$textboxes.each(function(){

			let $textbox = $(this);

			$textbox
				// Unbind existing alphanum event handlers
				.off(".alphanum")

				.on("keyup.alphanum change.alphanum paste.alphanum", function(e){

					let pastedText = "";

					if(e.originalEvent && e.originalEvent.clipboardData && e.originalEvent.clipboardData.getData)
						pastedText = e.originalEvent.clipboardData.getData("text/plain")

					// setTimeout is necessary for handling the 'paste' event
					setTimeout(function(){
						trimTextbox($textbox, trimFunction, settings, pastedText);
					}, 0);
				})

				.on("keypress.alphanum", function(e){

				// Determine which key is pressed.
				// If it's a control key, then allow the event's default action to occur eg backspace, tab
				let charCode = !e.charCode ? e.which : e.charCode;
				if(isControlKey(charCode)
					|| e.ctrlKey
					|| e.metaKey ) // cmd on MacOS
					return;

				let newChar         = String.fromCharCode(charCode);

				// Determine if some text was selected / highlighted when the key was pressed
				let selectionObject = $textbox.selection();
				let start = selectionObject.start;
				let end   = selectionObject.end;

				let textBeforeKeypress  = $textbox.val();

				// The new char may be inserted:
				//  1) At the start
				//  2) In the middle
				//  3) At the end
				//  4) User highlights some text and then presses a key which would replace the highlighted text
				//
				// Here we build the string that would result after the keypress.
				// If the resulting string is invalid, we cancel the event.
				// Unfortunately, it isn't enough to just check if the new char is valid because some chars
				// are position sensitive eg the decimal point '.'' or the minus sign '-'' are only valid in certain positions.
				let potentialTextAfterKeypress = textBeforeKeypress.substring(0, start) + newChar + textBeforeKeypress.substring(end);
				let validatedText              = trimFunction(potentialTextAfterKeypress, settings);

				// If the keypress would cause the textbox to contain invalid characters, then cancel the keypress event
				if(validatedText != potentialTextAfterKeypress)
					e.preventDefault();
			});
		});

	}

	// Ensure the text is a valid number when focus leaves the textbox
	// This catches the case where a user enters '-' or '.' without entering any digits
	function numericField_Blur(inputBox, settings) {
		let fieldValueNumeric = parseFloat($(inputBox).val());
		let $inputBox = $(inputBox);

		if(isNaN(fieldValueNumeric)) {
			$inputBox.val("");
			return;
		}

		if(isNumeric(settings.min) && fieldValueNumeric < settings.min)
			$inputBox.val("");

		if(isNumeric(settings.max) && fieldValueNumeric > settings.max)
			$inputBox.val("");
	}

	function isNumeric(value) {
		return !isNaN(value);
	}

	function isControlKey(charCode) {

		if(charCode >= 32)
			return false;
		if(charCode == 10)
			return false;
		if(charCode == 13)
			return false;

		return true;
	}

	// One way to prevent a character being entered is to cancel the keypress event.
	// However, this gets messy when you have to deal with things like copy paste which isn't a keypress.
	// Which event gets fired first, keypress or keyup? What about IE6 etc etc?
	// Instead, it's easier to allow the 'bad' character to be entered and then to delete it immediately after.

	function trimTextbox($textBox, trimFunction, settings, pastedText){

		let inputString = $textBox.val();

		if(inputString == "" && pastedText.length > 0)
			inputString = pastedText;

		let outputString = trimFunction(inputString, settings);

		if(inputString == outputString)
			return;

		let caretPos = $textBox.alphanum_caret();

		$textBox.val(outputString);

		//Reset the caret position
		if(inputString.length ==(outputString.length + 1))
			$textBox.alphanum_caret(caretPos - 1);
		else
			$textBox.alphanum_caret(caretPos);
	}

	function getCombinedSettingsAlphaNum(settings, defaultSettings){
		if(typeof defaultSettings == "undefined")
			defaultSettings = DEFAULT_SETTINGS_ALPHANUM;
		let userSettings, combinedSettings = {};
		if(typeof settings === "string")
			userSettings = CONVENIENCE_SETTINGS_ALPHANUM[settings];
		else if(typeof settings == "undefined")
			userSettings = {};
		else
			userSettings = settings;

		$.extend(combinedSettings, defaultSettings, userSettings);

		if(typeof combinedSettings.blacklist == 'undefined')
			combinedSettings.blacklistSet = getBlacklistSet(combinedSettings.allow, combinedSettings.disallow);

		return combinedSettings;
	}

	function getCombinedSettingsNum(settings){
		let userSettings, combinedSettings = {};
		if(typeof settings === "string")
			userSettings = CONVENIENCE_SETTINGS_NUMERIC[settings];
		else if(typeof settings == "undefined")
			userSettings = {};
		else
			userSettings = settings;

		$.extend(combinedSettings, DEFAULT_SETTINGS_NUM, userSettings);

		return combinedSettings;
	}


	// This is the heart of the algorithm
	function alphanum_allowChar(validatedStringFragment, Char, settings){

		if(settings.maxLength && validatedStringFragment.length >= settings.maxLength)
			return false;

		if(settings.allow.indexOf(Char) >=0 )
			return true;

		if(settings.allowSpace && (Char == " "))
			return true;

		if(!settings.allowNewline && (Char == '\n' || Char == '\r'))
			return false;

		if(settings.blacklistSet.contains(Char))
			return false;

		if(!settings.allowNumeric && DIGITS[Char])
			return false;

		if(!settings.allowUpper && isUpper(Char))
			return false;

		if(!settings.allowLower && isLower(Char))
			return false;

		if(!settings.allowCaseless && isCaseless(Char))
			return false;

		if(!settings.allowLatin && LATIN_CHARS.contains(Char))
			return false;

		if(!settings.allowOtherCharSets){
			if(DIGITS[Char] || LATIN_CHARS.contains(Char))
				return true;
			else
				return false;
		}

		return true;
	}

	function numeric_allowChar(validatedStringFragment, Char, settings){

		if(DIGITS[Char]) {

			if(isMaxDigitsReached(validatedStringFragment, settings))
				return false;

			if(isMaxPreDecimalsReached(validatedStringFragment, settings))
				return false;

			if(isMaxDecimalsReached(validatedStringFragment, settings))
				return false;

			if(isGreaterThanMax(validatedStringFragment + Char, settings))
				return false;

			if(isLessThanMin(validatedStringFragment + Char, settings))
				return false;

			return true;
		}

		if(settings.allowPlus && Char == '+' && validatedStringFragment == '')
			return true;

		if(settings.allowMinus && Char == '-' && validatedStringFragment == '')
			return true;

		if(Char == THOU_SEP && settings.allowThouSep && allowThouSep(validatedStringFragment))
			return true;

		if(Char == DEC_SEP) {
			// Only one decimal separator allowed
			if(validatedStringFragment.indexOf(DEC_SEP) >= 0)
				return false;
			// Don't allow decimal separator when maxDecimalPlaces is set to 0
			if(settings.allowDecSep && settings.maxDecimalPlaces === 0)
				return false;
			if(settings.allowDecSep)
				return true;
		}

		return false;
	}

	function countDigits(string) {

		// Error handling, nulls etc
		string = string + "";

		// Count the digits
		return string.replace(/[^0-9]/g,"").length;
	}

	function isMaxDigitsReached(string, settings) {

		let maxDigits = settings.maxDigits;

		if(maxDigits === "" || isNaN(maxDigits))
			return false; // In this case, there is no maximum

		let numDigits = countDigits(string);

		if(numDigits >= maxDigits)
			return true;

		return false;
	}

	function isMaxDecimalsReached(string, settings) {

		let maxDecimalPlaces = settings.maxDecimalPlaces;

		if(maxDecimalPlaces === "" || isNaN(maxDecimalPlaces))
			return false; // In this case, there is no maximum

		let indexOfDecimalPoint = string.indexOf(DEC_SEP);

		if(indexOfDecimalPoint == -1)
			return false;

		let decimalSubstring = string.substring(indexOfDecimalPoint);
		let numDecimals = countDigits(decimalSubstring);

		if(numDecimals >= maxDecimalPlaces)
			return true;

		return false;
	}

	function isMaxPreDecimalsReached(string, settings) {

		let maxPreDecimalPlaces = settings.maxPreDecimalPlaces;

		if(maxPreDecimalPlaces === "" || isNaN(maxPreDecimalPlaces))
			return false; // In this case, there is no maximum

		let indexOfDecimalPoint = string.indexOf(DEC_SEP);

		if(indexOfDecimalPoint >= 0)
			return false;

		let numPreDecimalDigits = countDigits(string);

		if(numPreDecimalDigits >= maxPreDecimalPlaces)
			return true;

		return false;
	}

	function isGreaterThanMax(numericString, settings) {

		if(!settings.max || settings.max < 0)
			return false;

		let outputNumber = parseFloat(numericString);
		if(outputNumber > settings.max)
			return true;

		return false;
	}

	function isLessThanMin(numericString, settings) {

		if(!settings.min || settings.min > 0)
			return false;

		let outputNumber = parseFloat(numericString);
		if(outputNumber < settings.min)
			return true;

		return false;
	}

	/********************************
	 * Trims a string according to the settings provided
	 ********************************/
	function trimAlphaNum(inputString, settings){

		if(typeof inputString != "string")
			return inputString;

		let inChars = inputString.split("");
		let outChars = [];
		let i = 0;
		let Char;

		for(i=0; i<inChars.length; i++){
			Char = inChars[i];
			let validatedStringFragment = outChars.join("");
			if(alphanum_allowChar(validatedStringFragment, Char, settings))
				outChars.push(Char);
		}

		let outputString = outChars.join("");

		if(settings.forceLower)
			outputString = outputString.toLowerCase();
		else if(settings.forceUpper)
			outputString = outputString.toUpperCase();

		return outputString;
	}

	function trimNum(inputString, settings){
		if(typeof inputString != "string")
			return inputString;

		let inChars = inputString.split("");
		let outChars = [];
		let i = 0;
		let Char;

		for(i=0; i<inChars.length; i++){
			Char = inChars[i];
			let validatedStringFragment = outChars.join("");
			if(numeric_allowChar(validatedStringFragment, Char, settings))
				outChars.push(Char);
		}

		return outChars.join("");
	}

	function isUpper(Char){
		let upper = Char.toUpperCase();
		let lower = Char.toLowerCase();

		if( (Char == upper) && (upper != lower))
			return true;
		else
			return false;
	}

	function isLower(Char){
		let upper = Char.toUpperCase();
		let lower = Char.toLowerCase();

		if( (Char == lower) && (upper != lower))
			return true;
		else
			return false;
	}

	function isCaseless(Char){
		if(Char.toUpperCase() == Char.toLowerCase())
			return true;
		else
			return false;
	}

	function getBlacklistSet(allow, disallow){

		let setOfBadChars  = new Set(BLACKLIST + disallow);
		let setOfGoodChars = new Set(allow);

		let blacklistSet   = setOfBadChars.subtract(setOfGoodChars);

		return blacklistSet;
	}

	function getDigitsMap(){
		let array = "0123456789".split("");
		let map = {};
		let i = 0;
		let digit;

		for(i=0; i<array.length; i++){
			digit = array[i];
			map[digit] = true;
		}

		return map;
	}

	function getLatinCharsSet(){
		let lower = "abcdefghijklmnopqrstuvwxyz";
		let upper = lower.toUpperCase();
		let azAZ = new Set(lower + upper);

		return azAZ;
	}

	function allowThouSep(currentString) {

		// Can't start with a THOU_SEP
		if(currentString.length == 0)
			return false;

		// Can't have a THOU_SEP anywhere after a DEC_SEP
		let posOfDecSep = currentString.indexOf(DEC_SEP);
		if(posOfDecSep >= 0)
			return false;

		let posOfFirstThouSep       = currentString.indexOf(THOU_SEP);

		// Check if this is the first occurrence of a THOU_SEP
		if(posOfFirstThouSep < 0)
			return true;

		let posOfLastThouSep        = currentString.lastIndexOf(THOU_SEP);
		let charsSinceLastThouSep   = currentString.length - posOfLastThouSep - 1;

		// Check if there has been 3 digits since the last THOU_SEP
		if(charsSinceLastThouSep < 3)
			return false;

		let digitsSinceFirstThouSep = countDigits(currentString.substring(posOfFirstThouSep));

		// Check if there has been a multiple of 3 digits since the first THOU_SEP
		if((digitsSinceFirstThouSep % 3) > 0)
			return false;

		return true;
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Implementation of a Set
	////////////////////////////////////////////////////////////////////////////////////
	function Set(elems){
		if(typeof elems == "string")
			this.map = stringToMap(elems);
		else
			this.map = {};
	}

	Set.prototype.add = function(set){

		let newSet = this.clone();

		for(let key in set.map)
			newSet.map[key] = true;

		return newSet;
	}

	Set.prototype.subtract = function(set){

		let newSet = this.clone();

		for(let key in set.map)
			delete newSet.map[key];

		return newSet;
	}

	Set.prototype.contains = function(key){
		if(this.map[key])
			return true;
		else
			return false;
	}

	Set.prototype.clone = function(){
		let newSet = new Set();

		for(let key in this.map)
			newSet.map[key] = true;

		return newSet;
	}
	////////////////////////////////////////////////////////////////////////////////////

	function stringToMap(string){
		let map = {};
		let array = string.split("");
		let i=0;
		let Char;

		for(i=0; i<array.length; i++){
			Char = array[i];
			map[Char] = true;
		}

		return map;
	}

	// Backdoor for testing
	$.fn.alphanum.backdoorAlphaNum = function(inputString, settings){
		let combinedSettings = getCombinedSettingsAlphaNum(settings);

		return trimAlphaNum(inputString, combinedSettings);
	};

	$.fn.alphanum.backdoorNumeric = function(inputString, settings){
		let combinedSettings = getCombinedSettingsNum(settings);

		return trimNum(inputString, combinedSettings);
	};

	$.fn.alphanum.setNumericSeparators = function(settings) {

		if(settings.thousandsSeparator.length != 1)
			return;

		if(settings.decimalSeparator.length != 1)
			return;

		THOU_SEP = settings.thousandsSeparator;
		DEC_SEP = settings.decimalSeparator;
	}

})( jQuery );

/*eslint-disable */
//Include the 3rd party lib: jquery.caret.js


// Set caret position easily in jQuery
// Written by and Copyright of Luke Morton, 2011
// Licensed under MIT
(function ($) {
	// Behind the scenes method deals with browser
	// idiosyncrasies and such
	function caretTo(el, index) {
		if (el.createTextRange) {
			let range = el.createTextRange();
			range.move("character", index);
			range.select();
		} else if (el.selectionStart != null) {
			el.focus();
			el.setSelectionRange(index, index);
		}
	};

	// Another behind the scenes that collects the
	// current caret position for an element

	// TODO: Get working with Opera
	function caretPos(el) {
		if ("selection" in document) {
			let range = el.createTextRange();
			try {
				range.setEndPoint("EndToStart", document.selection.createRange());
			} catch (e) {
				// Catch IE failure here, return 0 like
				// other browsers
				return 0;
			}
			return range.text.length;
		} else if (el.selectionStart != null) {
			return el.selectionStart;
		}
	};

	// The following methods are queued under fx for more
	// flexibility when combining with $.fn.delay() and
	// jQuery effects.

	// Set caret to a particular index
	$.fn.alphanum_caret = function (index, offset) {
		if (typeof(index) === "undefined") {
			return caretPos(this.get(0));
		}

		return this.queue(function (next) {
			if (isNaN(index)) {
				let i = $(this).val().indexOf(index);

				if (offset === true) {
					i += index.length;
				} else if (typeof(offset) !== "undefined") {
					i += offset;
				}

				caretTo(this, i);
			} else {
				caretTo(this, index);
			}

			next();
		});
	};
}(jQuery));

/**********************************************************
* Selection Library
* Used to determine what text is highlighted in the textbox before a key is pressed.
* http://donejs.com/docs.html#!jQuery.fn.selection
* https://github.com/jupiterjs/jquerymx/blob/master/dom/selection/selection.js
***********************************************************/
(function(e){let t=function(e){return e.replace(/([a-z])([a-z]+)/gi,function(e,t,n){return t+n.toLowerCase()}).replace(/_/g,"")},n=function(e){return e.replace(/^([a-z]+)_TO_([a-z]+)/i,function(e,t,n){return n+"_TO_"+t})},r=function(e){return e?e.ownerDocument.defaultView||e.ownerDocument.parentWindow:window},i=function(t,n){let r=e.Range.current(t).clone(),i=e.Range(t).select(t);if(!r.overlaps(i)){return null}if(r.compare("START_TO_START",i)<1){startPos=0;r.move("START_TO_START",i)}else{fromElementToCurrent=i.clone();fromElementToCurrent.move("END_TO_START",r);startPos=fromElementToCurrent.toString().length}if(r.compare("END_TO_END",i)>=0){endPos=i.toString().length}else{endPos=startPos+r.toString().length}return{start:startPos,end:endPos}},s=function(t){let n=r(t);if(t.selectionStart!==undefined){if(document.activeElement&&document.activeElement!=t&&t.selectionStart==t.selectionEnd&&t.selectionStart==0){return{start:t.value.length,end:t.value.length}}return{start:t.selectionStart,end:t.selectionEnd}}else if(n.getSelection){return i(t,n)}else{try{if(t.nodeName.toLowerCase()=="input"){let s=r(t).document.selection.createRange(),o=t.createTextRange();o.setEndPoint("EndToStart",s);let u=o.text.length;return{start:u,end:u+s.text.length}}else{let a=i(t,n);if(!a){return a}let f=e.Range.current().clone(),l=f.clone().collapse().range,c=f.clone().collapse(false).range;l.moveStart("character",-1);c.moveStart("character",-1);if(a.startPos!=0&&l.text==""){a.startPos+=2}if(a.endPos!=0&&c.text==""){a.endPos+=2}return a}}catch(h){return{start:t.value.length,end:t.value.length}}}},o=function(e,t,n){let i=r(e);if(e.setSelectionRange){if(n===undefined){e.focus();e.setSelectionRange(t,t)}else{e.select();e.selectionStart=t;e.selectionEnd=n}}else if(e.createTextRange){let s=e.createTextRange();s.moveStart("character",t);n=n||t;s.moveEnd("character",n-e.value.length);s.select()}else if(i.getSelection){let o=i.document,u=i.getSelection(),f=o.createRange(),l=[t,n!==undefined?n:t];a([e],l);f.setStart(l[0].el,l[0].count);f.setEnd(l[1].el,l[1].count);u.removeAllRanges();u.addRange(f)}else if(i.document.body.createTextRange){let f=document.body.createTextRange();f.moveToElementText(e);f.collapse();f.moveStart("character",t);f.moveEnd("character",n!==undefined?n:t);f.select()}},u=function(e,t,n,r){if(typeof n[0]==="number"&&n[0]<t){n[0]={el:r,count:n[0]-e}}if(typeof n[1]==="number"&&n[1]<=t){n[1]={el:r,count:n[1]-e};}},a=function(e,t,n){let r,i;n=n||0;for(let s=0;e[s];s++){r=e[s];if(r.nodeType===3||r.nodeType===4){i=n;n+=r.nodeValue.length;u(i,n,t,r)}else if(r.nodeType!==8){n=a(r.childNodes,t,n)}}return n};jQuery.fn.selection=function(e,t){if(e!==undefined){return this.each(function(){o(this,e,t)})}else{return s(this[0])}};e.fn.selection.getCharElement=a})(jQuery);
/*eslint-enable */