"use strict";

var _objs_arr = [];
var _notes_arr = [];

var _obj = {};
var _tmpStr = '';
var _delimiter = ':';
var _endTag = "<br/>";
var _mappings = {};

var _mappings_attr = {};
var _mappings_note = {};

var _streams_arr = [];
var StreamInstanceStruct = function(){
	this.tmpStr =  '';
	this.obj =  {};
	this.objs_arr = [];
	this.notes_arr = [];
}

exports.config = function(opts){
	if( opts.hasOwnProperty('delimiter') ) 	_delimiter = opts.delimiter;
	if( opts.hasOwnProperty('endTag') ) 	_endTag = opts.endTag;  
	if( opts.hasOwnProperty('mappings') ){
		if( opts.mappings.hasOwnProperty('attr') ) _mappings_attr = opts.mappings.attr;
		if( opts.mappings.hasOwnProperty('note') ) _mappings_note = opts.mappings.note;
	}
}

exports.parse = function(str, streamID, cb){

	if( typeof cb !== 'function' ) cb = null;

	if( typeof str !== 'string'){
		var err = new Error('Chunk is not a string');
		if(cb) cb(err);
		return;
	}

	if(!str.length) return;

	var delimiter = _delimiter;

	var substr = str.trim();
	
	if( !substr.length ) return;

	var endTagIdx = substr.indexOf(_endTag);

	if( !_streams_arr.hasOwnProperty(streamID) ){
		_streams_arr[streamID] = new StreamInstanceStruct();
	}

	var inst = _streams_arr[streamID]; 

	var slicedStr = inst.tmpStr + substr;

	var segments_arr = slicedStr.split( delimiter );

	segments_arr.forEach(function(seg){

		Object.keys(_mappings_attr).forEach(function(key){

			var el = _mappings_attr[key];
			if( seg.indexOf(el.tag) != -1 ){
				
				var startIdx =  slicedStr.indexOf(el.tag);
				if( startIdx == -1 ) return;

				var delimiterIdx = slicedStr.indexOf( _delimiter, startIdx);
				if( delimiterIdx == -1 ) return;

				var endIdx = delimiterIdx + (_delimiter.length );

				slicedStr = _strExplodeJoiner(slicedStr, 0, startIdx, endIdx);

				var content = seg.replace(el.tag, "");
				var str = el.transform(content);
				inst.obj[key] = str;	

				return;
			}

		});

		
		if( seg.indexOf( _mappings_note.tag ) != -1 ){ 

			var noteTagStartIdx = slicedStr.indexOf( _mappings_note.tag );	
			if( noteTagStartIdx == -1 ) return;

			var noteTagEndIdx = slicedStr.indexOf(_delimiter, noteTagStartIdx);
			if( noteTagEndIdx == -1 ) return;

			var noteTagOuterEndIdx = noteTagEndIdx + (_delimiter.length);	
			
			slicedStr = _strExplodeJoiner( slicedStr, 0, noteTagStartIdx, noteTagOuterEndIdx);
			var note = seg.replace( _mappings_note.tag, "" );

			inst.notes_arr.push(note);
		}
		

	});

	inst.tmpStr = slicedStr;

	if( endTagIdx >= 0 ){

		if(  !_isEmptyObject(inst.obj) ){
			//_objs_arr.push(_obj);
		}

		if( cb ) cb(null, streamID, inst.obj, inst.notes_arr );

		inst = null;
		delete _streams_arr[streamID];

	}

}

exports.getItems = function(){
	return _objs_arr;
}

exports.getItemAt = function(idx){
	idx = Math.abs(idx);
	if(!isNaN(idx) && idx < _objs_arr.length ){
		return _objs_arr[idx];
	}
	return null;
}

exports.clear = function(){
	_objs_arr.length = 0;
}

function _isEmptyObject( obj ){
	return (Object.getOwnPropertyNames(obj).length === 0);
}

function _strExplodeJoiner(str, start1, end1, start2, end2){
	end2 = end2 || str.length;

	var s_left = str.substring(start1, end1);  
	var s_right = str.substring(start2, end2);
	var newStr = s_left + s_right;

	return newStr;
}