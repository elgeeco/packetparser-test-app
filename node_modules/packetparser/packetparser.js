"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var base64chunkparser = require('./base64chunkparser');
var stringchunkparser = require('./stringchunkparser');

var EVENT_BASE64_PARSED_DATA 	= exports.EVENT_BASE64_PARSED_DATA 		= 'EVENT_BASE64_PARSED_DATA';  
var EVENT_BASE64_PARSING_FINISH = exports.EVENT_BASE64_PARSING_FINISH 	= 'EVENT_BASE64_PARSING_FINISH';
var EVENT_PACKET_PARSED 		= exports.EVENT_PACKET_PARSED 			= 'EVENT_PACKET_PARSED';
var EVENT_PACKET_PARSING_FINISH = exports.EVENT_PACKET_PARSING_FINISH 	= 'EVENT_PACKET_PARSING_FINISH'; 

var _packetparser = null;

function PacketParser(){
	EventEmitter.call(this);
	_packetparser = this;
}

util.inherits(PacketParser, EventEmitter);

PacketParser.prototype.config = function(opts){
	var obj = {};
	if( opts.hasOwnProperty('endTag')) 		obj.endTag = opts.endTag;
	if( opts.hasOwnProperty('delimiter'))	obj.delimiter = opts.delimiter;
	if( opts.hasOwnProperty('mappings'))	obj.mappings = opts.mappings;

	stringchunkparser.config( obj );
}

PacketParser.prototype.parse = function(chunk){
	_parseBase64Chunks(chunk);
}

function _parseBase64Chunks(data){

    var outStr = base64chunkparser.parse(data, function(base64Str, isFinished){
        
        if( base64Str && base64Str.length ){
        	_packetparser.emit(EVENT_BASE64_PARSED_DATA, base64Str);
        }

        if( isFinished ){
        	_packetparser.emit(EVENT_BASE64_PARSING_FINISH);
        }

    });

    _parseStringChunks(outStr);

};

function _parseStringChunks(data){
    var fileParsingDone = false;
    
    var fileData = {};

    stringchunkparser.parse( data, function(obj){
        //console.log( JSON.stringify(obj) );
        fileData = obj;
        fileParsingDone = true // Send data for new file
    });

    if( fileParsingDone ) _packetparser.emit(EVENT_PACKET_PARSING_FINISH, fileData); 
    else _packetparser.emit( EVENT_PACKET_PARSED );
}

exports.create = function(){
	return new PacketParser();
}
