'use strict';

var _streams_arr = [];

var StreamInstanceStruct = function(){
    this.streamProgress = false;
    this.remainingChunks = null;
}

var _base64Tag = '<data>';
var _endTag = "</>";
var _useNeedle = true;


exports.config = function(opts){
	if(opts.hasOwnProperty('base64Tag'))	_base64Tag = opts.base64Tag;
	if(opts.hasOwnProperty('endTag'))		_endTag  = opts.endTag;
	if(opts.hasOwnProperty('useNeedle'))	_useNeedle = opts.useNeedle;
}

exports.parse = function(strChunk, streamID, callback){

	var needle = _base64Tag;

	var cb = null;
	if( typeof callback == 'function' ) cb = callback;

    if( typeof strChunk !== 'string' ){
        var err = new Error('Chunk is not a string');
        if(cb) cb(err);
        return;
    }

    if( !_streams_arr.hasOwnProperty(streamID) ){
        _streams_arr[streamID] = new StreamInstanceStruct();
    }

    var inst = _streams_arr[streamID];

	var idx = 0;
	
	if( ! inst.streamProgress ){
        
        if( _useNeedle ){
            idx = strChunk.indexOf( needle );
        }

    	if( idx == -1 ) return _outputStruct(streamID, strChunk, inst.streamProgress); 

    	if( idx >= 0){
    		inst.streamProgress = true;
    	}
	}

    var newlineIdx = strChunk.indexOf(_endTag, idx);
    if( newlineIdx >= 0 ){
    	inst.streamProgress = false;
    }

    var preRemainingStr = null;
    var postRemainingStr = null;
    var base64Str = null;
    
    var transformedChunk = '';

    if( idx > 0 ){
    	preRemainingStr = strChunk.substring(0, idx);
    }

    if( newlineIdx >= 0 ){
    	if( (strChunk.length) > ((newlineIdx + _endTag.length) - 1 ) ){
    		postRemainingStr = strChunk.substring((newlineIdx + _endTag.length));
    	}
	}	

	if( preRemainingStr ) transformedChunk += preRemainingStr;
	if( postRemainingStr ) transformedChunk += postRemainingStr;

    var endIdx = strChunk.length;
    if(newlineIdx >= 0) endIdx = newlineIdx;
    //if( idx == -1 ) idx = 0;
    var rawDataStr = '';

    if( newlineIdx >= 0 ){
        rawDataStr = strChunk.substring(idx, endIdx);
    }else{
        rawDataStr = strChunk.substring(idx);
    }

    if( _useNeedle ){
    	base64Str = rawDataStr.replace(needle, "");
	}else{
		base64Str = rawDataStr;
	}

	if(inst.remainingChunks){
		base64Str = inst.remainingChunks + base64Str;
	}

    if( base64Str ){
    	var rest = base64Str.length % 4;
    	if( rest ){
    		inst.remainingChunks = base64Str.substring(-1 * rest);
    		base64Str = base64Str.substring(0, -1 * rest);
    	}else{
    		inst.remainingChunks = null;
    	}
    }

    var isFinished = !inst.streamProgress;
    if(isFinished){
        _streams_arr[streamID] = null;
        delete _streams_arr[streamID];
    }

    if( cb ) cb(null, streamID, base64Str, isFinished);

    return _outputStruct(streamID, transformedChunk, !isFinished );
}

function _outputStruct(streamID, transformedChunk, inStreamProgress){
	var out = {}; 
    out.streamID = streamID;
    out.transformedOutput = (transformedChunk) ? transformedChunk : null;
    out.inStreamingProgress = inStreamProgress;
    return out;
}