"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var base64chunkparser = require('./base64chunkparser');
var stringchunkparser = require('./stringchunkparser');

var EVENT_BASE64_PARSED_DATA    = exports.EVENT_BASE64_PARSED_DATA 		= 'EVENT_BASE64_PARSED_DATA';  
var EVENT_BASE64_PARSING_FINISH = exports.EVENT_BASE64_PARSING_FINISH 	= 'EVENT_BASE64_PARSING_FINISH';
var EVENT_PACKET_PARSED 		= exports.EVENT_PACKET_PARSED 			= 'EVENT_PACKET_PARSED';
var EVENT_PACKET_PARSING_FINISH = exports.EVENT_PACKET_PARSING_FINISH 	= 'EVENT_PACKET_PARSING_FINISH'; 
var EVENT_PACKET_PARSING_ERROR  = exports.EVENT_PACKET_PARSING_ERROR    = 'EVENT_PACKET_PARSING_ERROR';

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

PacketParser.prototype.parse = function(chunk, streamID){
    streamID = streamID || new Date().getTime();
	_parseBase64Chunks(chunk, streamID);
}

function _parseBase64Chunks(data, streamID){

    var result = base64chunkparser.parse(data, streamID, function(err, sid, base64Str, isFinished){

        if( err ){
            return _packetparser.emit(EVENT_PACKET_PARSING_ERROR, err);
        }

        if( base64Str && base64Str.length ){
        	_packetparser.emit(EVENT_BASE64_PARSED_DATA, base64Str, sid);
        }

        if( isFinished ){
        	_packetparser.emit(EVENT_BASE64_PARSING_FINISH, sid);
        }

    });

    if( result.inStreamingProgress && !result.transformedOutput) {

        return _packetparser.emit( EVENT_PACKET_PARSED, result.streamID );
    }

    _parseStringChunks(result.transformedOutput, result.streamID );
};

function _parseStringChunks(data, streamID){
    var fileParsingDone = false;
    
    var fileData = {};
    var notes = [];

    stringchunkparser.parse( data, streamID, function(err, id, obj, notes_arr){
        if(err){
            return _packetparser.emit(EVENT_PACKET_PARSING_ERROR, err);
        }

        fileData = obj;
        notes = notes_arr;
        streamID = id;

        fileParsingDone = true;
    });

    if( fileParsingDone ) _packetparser.emit(EVENT_PACKET_PARSING_FINISH, fileData, notes, streamID); 
    else _packetparser.emit( EVENT_PACKET_PARSED, streamID );
}

exports.create = function(){
	return new PacketParser();
}
