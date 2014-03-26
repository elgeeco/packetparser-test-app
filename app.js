'use strict';

var fs = require('fs');
var path = require('path');
var PacketParser = require('./PacketParser');
var base64filegenerator = require('./base64filegenerator');
var dircreator = require('./dircreator');
var colors = require('colors');

var writeStream = null;
var filepath = __dirname + path.sep + 'files';

var files_arr = [base64filegenerator.pdfIcon(), base64filegenerator.pdfImage(), base64filegenerator.lockImage()];

var _c = 0;
var _dataChunks_arr = null;
var _files_idx = -1;

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
    setTimeout(function(){
        _sendDataChunks();  
    },500);
});

packetParser.on(PacketParser.EVENT_PACKET_PARSING_FINISH, function(filedata){
    console.log("Filedata: "  + JSON.stringify( filedata ) );
    setTimeout(function(){
        _sendDataChunks(true);  
    },500);
});

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

        var tmpFile = 'tmp-' + Math.round(Math.random() * 99999999);
        writeStream = null;
        writeStream = fs.createWriteStream(filepath + path.sep +  tmpFile, {flags: 'w',  encoding: 'base64'}); 

        _c = 0;

        file = files_arr[ _files_idx ];

        var dataChunks_arr = base64filegenerator.divideIntoChunks(file.data, true, true);
        dataChunks_arr[0] = "<data>" + dataChunks_arr[0];
        dataChunks_arr[dataChunks_arr.length - 1] = dataChunks_arr[dataChunks_arr.length - 1] + "</><br/>";
        //_dataChunks_arr = dataChunks_arr;

         var testStr_arr = ["<id>10</><filen","am","e>bi", "ld.jpg</><filesize>12342","353</><times", "tamp>1243543432</>"];
         _dataChunks_arr = testStr_arr.concat(dataChunks_arr); 

    }

    if( _c == 0 ){}
     
    data += _dataChunks_arr[ _c ]; 

    packetParser.parse(data);

    _c++;
};


dircreator.createdir(filepath);

//start simulation
_sendDataChunks(true);