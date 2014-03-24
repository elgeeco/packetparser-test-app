'use strict';

var fs = require('fs');
var path = require('path');
var base64chunkparser = require('./base64chunkparser');
var base64filegenerator = require('./base64filegenerator');

var writeStream = null;

var files_arr = [base64filegenerator.pdfIcon(), 
                base64filegenerator.pdfImage(),
                base64filegenerator.lockImage()];


var _c = 0;
var _dataChunks_arr = null;
var _files_idx = -1;

function _sendDataChunks(nextFile){

    nextFile = nextFile || false;

    var data = '';
    var file = null;

    if( nextFile ){
        _files_idx++;

        if( _files_idx == files_arr.length - 1 ){
            console.log("\nAll Files Transmitted");
            return;
        }

        var tmpFile = 'tmp-' + Math.round(Math.random() * 99999999);
        writeStream = null;
        writeStream = fs.createWriteStream(__dirname + path.sep +  tmpFile, {flags: 'w',  encoding: 'base64'}); 

        _c = 0;

        file = files_arr[ _files_idx ];

        var dataChunks_arr = base64filegenerator.divideIntoChunks(file.data, true, true);
        dataChunks_arr[0] = "<data>" + dataChunks_arr[0];
        dataChunks_arr[dataChunks_arr.length - 1] = dataChunks_arr[dataChunks_arr.length - 1] + "</>\n";
        _dataChunks_arr = dataChunks_arr;
    }

    if( _c == 0 ){
        data = "<filename>{filename}</><type>{type}</>";
        data.replace("{filename}", file.filename);
        data.replace("{type}", file.filetype);
    }
     
    data += _dataChunks_arr[ _c ]; 

    _parseDataChunks(data);

    _c++;
};

_sendDataChunks(true);

function _parseDataChunks(data){

    base64chunkparser.parse(data, function(base64Str, isFinished, preRemainingStr, postRemainingStr){

        console.log("\nStr:" + base64Str + ' Length:' + base64Str.length);

        var b = new Buffer(base64Str, 'base64');

        writeStream.write(b,  function(err){

            if(err){
                console.log(err.message);
                return;
            }

            if(preRemainingStr){
                tempStr = preRemainingStr + tempStr;
            }

            if(postRemainingStr){
                tempStr = tempStr + postRemainingStr;
            }

            console.log("\nWrite File");

            //if( idx < (data_arr.length - 1) ){
            if( isFinished == false){
                _sendDataChunks();
            }
            else{
                console.log("\nWrite File end");
                writeStream.end();
                _sendDataChunks(true);
            }

        });

    });
    
};
