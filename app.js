'use strict';

var fs = require('fs');
var path = require('path');
var PacketParser = require('packetparser');
var base64splitter = require('base64splitter');
var dircleaner = require('dircleaner');
var colors = require('colors');
var maps = require('./lib/mappings');

//------------------------------------------------------
//SETUP
//------------------------------------------------------
var FILEPATH = path.join(__dirname, 'files_copy');
var SEND_INTERVAL = 500;
var FILES = [base64splitter.pdfImage, base64splitter.ghostImage];
//------------------------------------------------------

var _writeStream = null;
var _c = 0;
var _dataChunks_arr = null;
var _files_idx = -1;
var _lastFileTmpPath = null;
var _lastFileOrigName = null;
var _fileWrittenFlag = false;
var _lastSID = null;

var packetParser = PacketParser.create();
packetParser.config({endTag: '<br/>', delimiter: '</>', mappings: maps});

packetParser.on(PacketParser.EVENT_BASE64_PARSED_DATA, function(base64data, streamID){
    var b = new Buffer(base64data, 'base64');

    _writeStream.write(b,  function(err){
        if(err) return console.log(err.message);

        console.log("\nWrite chunk into file".green);
        console.log("Base64 Chunk String: " + base64data); 
        console.log("Base64 Chunk Length: " + base64data.length);

    });
});

packetParser.on(PacketParser.EVENT_BASE64_PARSING_FINISH, function(streamID){
    console.log("All Base64 Chunks received for stream: %s".blue, streamID);
    _writeStream.end();
});

packetParser.on(PacketParser.EVENT_PACKET_PARSED, function(streamID){
    console.log("Packet parsed for stream %s", streamID);
    _sendNext();
});

packetParser.on(PacketParser.EVENT_PACKET_PARSING_FINISH, function(filedata, notes, streamID){
    console.log("Filedata: " + JSON.stringify( filedata ) + " Notes: " + notes + ' Stream ID: ' + streamID);

    var aborted = false;
    notes.forEach(function(note){
        if(note == 'aborted' ) aborted = true; 
    });

    if( !aborted){
        _lastFileOrigName = filedata.filename;
        _sendNext(true);
    }else{
        fs.unlink(_lastFileTmpPath, function(err){
            if(err) console.log(err);
        });
    }
});

packetParser.on(PacketParser.EVENT_PACKET_PARSING_ERROR, function(err){
    console.log("Error parsing packets: " + err.message);
});

function _sendNext(nextFile){
    nextFile = nextFile || false;

    if( nextFile ){
        //Wait until file was written...
        if( _fileWrittenFlag ){
            fs.rename( _lastFileTmpPath , path.join(FILEPATH, _lastFileOrigName) );
            setTimeout(function(){_sendDataChunks(nextFile);},SEND_INTERVAL);
        }else{
            setTimeout(function(){_sendNext(nextFile);},SEND_INTERVAL);
        }  
    }else{
        setTimeout(function(){_sendDataChunks(nextFile);},SEND_INTERVAL);
    }

}

function _sendDataChunks(nextFile){

    nextFile = nextFile || false;

    var data = '';
    var file = null;

    if( nextFile ){

        if( _files_idx == FILES.length - 1 ){
            console.log("\nAll Files Transmitted".yellow);
            return;
        }

        _files_idx++;

        _lastFileTmpPath = null;
        _lastFileOrigName = null;
        _fileWrittenFlag = false;       

        var tmpFile = 'tmp-' + Math.round(Math.random() * 99999999);
        _lastFileTmpPath = path.join(FILEPATH, tmpFile); 

        if( _writeStream ) _writeStream.removeAllListeners();

        _writeStream = null;
        _writeStream = fs.createWriteStream( _lastFileTmpPath , {flags: 'w',  encoding: 'base64'}); 
        _writeStream.on('finish', function(){
            _fileWrittenFlag = true;
        });

        _c = 0;

        file = FILES[ _files_idx ];

        var dataChunks_arr = base64splitter.explode(file.data, true, true);
        dataChunks_arr[dataChunks_arr.length - 1] = dataChunks_arr[dataChunks_arr.length - 1] + '</>';
        dataChunks_arr.push('<br/>');

        var fileInfosStr = "<id>{id}</><filename>{filename}</><filesize>{filesize}</><timestamp>{timestamp}</><data>";
        fileInfosStr = fileInfosStr.replace('{id}', Math.round(Math.random() * 100 ));
        fileInfosStr = fileInfosStr.replace('{filename}', FILES[_files_idx].filename );
        fileInfosStr = fileInfosStr.replace('{filesize}', Math.round( Math.random() * 1000000 ) );
        fileInfosStr = fileInfosStr.replace('{timestamp}', 1000000000 + (Math.round(Math.random() * 999999999)));

        var fileInfosStr_arr =  base64splitter.explode( fileInfosStr, true, false, 3, 4 );
        _dataChunks_arr = fileInfosStr_arr.concat(dataChunks_arr); 

        console.log("All Package Chunks: ".green);
        console.log( _dataChunks_arr);

        _lastSID = Math.round( Math.random() * 9999999 );
        console.log( _lastSID.toString().red )
    }
     
    data += _dataChunks_arr[ _c ]; 

    packetParser.parse(data, _lastSID);

    _c++;
};

(function _init(){
    dircleaner.clean(FILEPATH, true);
    _sendDataChunks(true);
})();

