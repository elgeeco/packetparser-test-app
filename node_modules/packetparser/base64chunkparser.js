'use strict';

var _streamProgress = false;
var _remainingChunks = null;

var _base64Tag = '<data>';
var _endTag = "</>";
var _useNeedle = true;


exports.config = function(opts){
	if(opts.hasOwnProperty('base64Tag'))	_base64Tag = opts.base64Tag;
	if(opts.hasOwnProperty('endTag'))		_endTag  = opts.endTag;
	if(opts.hasOwnProperty('useNeedle'))	_useNeedle = opts.useNeedle;
}

exports.parse = function(strChunk, callback){

	var needle = _base64Tag;

	var cb = null;
	if( typeof callback == 'function' ) cb = callback;

	var idx = 0;
	if( _useNeedle ){
		idx = strChunk.indexOf( needle );
	}
	
	if( !_streamProgress ){
    	if( idx == -1 ) return strChunk; //cb(null, true, null, null);

    	if( idx >= 0){
    		_streamProgress = true;
    	}
	}

    var newlineIdx = strChunk.indexOf(_endTag, idx);
    if( newlineIdx >= 0 ){
    	_streamProgress = false;
    }

    var preRemainingStr = null;
    var postRemainingStr = null;
    var base64Str = null;
    
    var transformedChunk = '';

    if( idx > 0 ){
    	preRemainingStr = strChunk.substring(0, idx);
    }

    if( (strChunk.length) > ((newlineIdx + _endTag.length)-1) ){
    	postRemainingStr = strChunk.substring((newlineIdx + _endTag.length));
    }

	if( preRemainingStr ) transformedChunk += preRemainingStr;
	if( postRemainingStr ) transformedChunk += postRemainingStr;

    var endIdx = strChunk.length;
    if(newlineIdx >= 0) endIdx = newlineIdx;
    if( idx == -1 ) idx = 0;
    var rawDataStr = strChunk.substring(idx, endIdx);

    if( _useNeedle ){
    	base64Str = rawDataStr.replace(needle, "");
	}else{
		base64Str = rawDataStr;
	}

	if(_remainingChunks){
		base64Str = _remainingChunks + base64Str;
	}

	var rest = base64Str.length % 4;
	if( rest ){
		_remainingChunks = base64Str.substring(-1 * rest);
		base64Str = base64Str.substring(0, -1 * rest);
	}else{
		_remainingChunks = null;
	}

    var isFinished = !_streamProgress;
    if( cb ) cb(base64Str, isFinished);

    return (transformedChunk) ? transformedChunk : null;
}