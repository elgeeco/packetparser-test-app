'use strict';

var fs = require('fs');
var path = require('path');
var PacketParser = require('packetparser');
var base64filegenerator = require('./base64filegenerator');
var dircreator = require('./dircreator');
var colors = require('colors');

var writeStream = null;
var filepath = __dirname + path.sep + 'files';

var files_arr = [base64filegenerator.pdfIcon(), base64filegenerator.pdfImage(), base64filegenerator.lockImage()];

var _c = 0;
var _dataChunks_arr = null;
var _files_idx = -1;

var _lastFileTmpPath = null;
var _lastFileOrigName = null;
var _fileWrittenFlag = false;

var maps = {
    id: { 
        tag:'<id>',
        transform: function(content){
            return content;
        }
    },
    filename: {
        tag: '<filename>',
        transform: function(content){
            return content;
        }
    },
    filesize: { 
        tag: '<filesize>',
        transform: function(content){
            return content + ' bytes';
        }
    },
    timestamp: {
        tag: '<timestamp>',
        transform: function(content){
            var date = new Date(parseInt(content) * 1000 );
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var secondes = date.getSeconds();
            return hours + ':' + minutes + ':' + secondes;
        } 
    }
};

var packetParser = PacketParser.create();
packetParser.config({endTag: '<br/>', delimiter: '</>', mappings: maps});

packetParser.on(PacketParser.EVENT_BASE64_PARSED_DATA, function(base64data){
    var b = new Buffer(base64data, 'base64');

    writeStream.write(b,  function(err){
        if(err) return console.log(err.message);

        console.log("\nWrite chunk into file".green);
        console.log("Base64 Chunk String: " + base64data); 
        console.log("Base64 Chunk Length: " + base64data.length);

    });
});

packetParser.on(PacketParser.EVENT_BASE64_PARSING_FINISH, function(){
    console.log("All Base64 Chunks received - Write File end".blue);
    writeStream.end();
});

packetParser.on(PacketParser.EVENT_PACKET_PARSED, function(){
    console.log("Packet parsed");
    _sendNext();
});

packetParser.on(PacketParser.EVENT_PACKET_PARSING_FINISH, function(filedata){
    console.log("Filedata: "  + JSON.stringify( filedata ) );
    _lastFileOrigName = filedata.filename;
    _sendNext(true);
});

var iv = 500;
function _sendNext(nextFile){
    nextFile = nextFile || false;

    if( nextFile ){
        //Wait until file was written...
        if( _fileWrittenFlag ){
            fs.rename( _lastFileTmpPath , filepath + path.sep + _lastFileOrigName);
            setTimeout(function(){_sendDataChunks(nextFile);},iv);
        }else{
            setTimeout(function(){_sendNext(nextFile);},iv);
        }  
    }else{
        setTimeout(function(){_sendDataChunks(nextFile);},iv);
    }

}


function _sendDataChunks(nextFile){

    nextFile = nextFile || false;

    var data = '';
    var file = null;

    if( nextFile ){

        if( _files_idx == files_arr.length - 1 ){
            console.log("\nAll Files Transmitted".yellow);
            return;
        }

        _files_idx++;
        _lastFileTmpPath = null;
        _lastFileOrigName = null;
        _fileWrittenFlag = false;

        var tmpFile = 'tmp-' + Math.round(Math.random() * 99999999);
        _lastFileTmpPath = filepath + path.sep +  tmpFile; 

        writeStream = null;
        writeStream = fs.createWriteStream( _lastFileTmpPath , {flags: 'w',  encoding: 'base64'}); 
        writeStream.on('finish', function(){
            _fileWrittenFlag = true;
        });

        _c = 0;

        file = files_arr[ _files_idx ];

        var dataChunks_arr = base64filegenerator.divideIntoChunks(file.data, true, true);
        dataChunks_arr[0] = "<data>" + dataChunks_arr[0];
        dataChunks_arr[dataChunks_arr.length - 1] = dataChunks_arr[dataChunks_arr.length - 1] + "</><br/>";
        //_dataChunks_arr = dataChunks_arr;

         //var testStr_arr = ["<id>10</><filen","am","e>bi", "ld.jpg</><filesize>12342","353</><times", "tamp>1243543432</>"];
         var fileInfosStr = "<id>{id}</><filename>{filename}</><filesize>{filesize}</><timestamp>{timestamp}</>";
         fileInfosStr = fileInfosStr.replace('{id}', Math.round(Math.random() * 100 ));
         fileInfosStr = fileInfosStr.replace('{filename}', files_arr[_files_idx].filename );
         fileInfosStr = fileInfosStr.replace('{filesize}', Math.round( Math.random() * 1000000 ) );
         fileInfosStr = fileInfosStr.replace('{timestamp}', 1000000000 + (Math.round(Math.random() * 999999999)));

         var fileInfosStr_arr =  base64filegenerator.divideIntoChunks( fileInfosStr, true, false, 3, 4 );
         _dataChunks_arr = fileInfosStr_arr.concat(dataChunks_arr); 

         console.log("All Package Chunks: ".green);
         console.log( _dataChunks_arr);
    }
     
    data += _dataChunks_arr[ _c ]; 

    packetParser.parse(data);

    _c++;
};


dircreator.createdir(filepath);

//start simulation
_sendDataChunks(true);