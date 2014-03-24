"use strict";

var objs_arr = [];

var _delimiter = ':';
var _endTag = "\n";

var _mappings = [];

exports.configs = function(opts){
	if( opts.hasOwnProperty('delimiter') ) 	_delimiter = opts.delimiter;
	if( opts.hasOwnProperty('endTag') ) 	_endTag = opts.endTag;  
	if( opts.hasOwnProperty('mappings') ) 	_mappings = opts.mappings;
}

exports.parse = function(str, delimiter){

	var delimiter = delimiter || ':';

	var substr = str.trim();
	
	if( !substr.length ) return;

	if( substr.substr( -1 ) == "\n"){
		substr = substr.substr(0, -1);
	}

	var segments_arr = substr.split( delimiter );

	var obj = {};

	segments_arr.forEach(function(seg){

	  var idx = seg.indexOf('>');
	  var type = seg.substring(1, idx);
	  var content = seg.substring(idx + 1);

	  switch(type){
	    case 'id':
	      obj['id'] = content;
	      break;

	    case 'filename':
	      obj['filename'] = content;
	      break;

	    case 'filesize':
	      obj['filesize'] = content + ' bytes';
	      break;

	    case 'timestamp':
	      var date = new Date(parseInt(content) * 1000 );
	      var hours = date.getHours();
	      var minutes = date.getMinutes();
	      var secondes = date.getSeconds();
	      obj['date'] = hours + ':' + minutes + ':' + secondes; 
	      break;

	    case '//data':
	      //obj['message'] = new Buffer(content, 'base64').toString();
	      //var b = new Buffer(content, 'base64');
	      //fs.writeFileSync('foo.gif', b, {mode: 0777});
	      break;
	  }

	});

	if(  _isEmptyObject(obj) ){
		conole.log('Data Object has no propertys');
	}else{
		objs_arr.push(obj);
		console.log("Data Object: " + JSON.stringify(obj));
	}
	
}

exports.getItem = function(id){

	objs_arr.forEach(function(item){
		if( id == item['id'] ){
			return item;
		}
	});

	return null;
}

function _isEmptyObject( obj ){
	return (Object.getOwnPropertyNames(obj).length === 0);
}