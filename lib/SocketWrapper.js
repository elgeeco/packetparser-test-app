"use strict";

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var fs = require('fs');
var path = require('path');


var SocketWrapper = function(socket, storageDir, packetParser){
    var self = this;

    EventEmitter.call(this);

    if( typeof socket === 'undefined' ){
        this.emit('error', new Error('Socket not defined'));
        return;
    }

    if( typeof packetParser === 'undefined' ){
        this.emit('error', new Error('PacketParser not defined'));
        return;
    }

    this.socket = socket;
    this.storageDir = storageDir || __dirname;
    this.packetParser = packetParser;
    this.id = 'id-' + new Date().getTime() + '-' + Math.round(Math.random() * 999999);
    
    this.newFileStream();

    socket.setEncoding('utf8');

    socket.on('data', function(data){
        console.log("\nReceiving new data".yellow);
        if( self.fileWritten ){
            self.newFileStream();
            self.fileWritten = false;
        }
        self.packetParser.parse(data, self.id);
    });

    socket.on('end', function(){
        console.log("Socket end");
    });

    socket.on('close', function(){
        console.log("Socket Closed with ID: " + self.id);
    });

    socket.on('error', function(){
        console.log('Socket error');
    });

}

util.inherits(SocketWrapper, EventEmitter);

SocketWrapper.prototype.newFileStream = function(){
    var self = this;

    this.fileWritten = false;
    this.tmpFileName = null;
    this.origFileName = null;

    if( this.hasOwnProperty('writeStream') && this.writeStream ){
        this.writeStream.removeAllListeners();
        this.writeStream = null;
    }

    this.tmpFileName = 'tmp-' + Math.round(Math.random() * 99999999);

    var tmpFilePath = path.join(this.storageDir, this.tmpFileName);

    this.writeStream = fs.createWriteStream( tmpFilePath , {flags: 'w',  encoding: 'base64'}); 

    this.writeStream.on('finish', function(){
        self._doRenameFile();
    }); 

}

SocketWrapper.prototype.writeToFileStream = function(chunk){
    var self = this;

    var b = new Buffer(chunk, 'base64');
    this.writeStream.write(b, function(err){
        if( err ) return self.emit('error', err);

        var str = "Write Chunk into Tmp File: " + self.tmpFileName; 
        //console.log("Base64 Chunk String: " + base64data); 
        console.log(str.green);
        console.log("Base64 Chunk Length: " + chunk.length + ' with Bytesize: ' + (Math.ceil(chunk.length / 3) * 4) );
    });
} 

SocketWrapper.prototype.writeToSocketStream = function(str){
    this.socket.write(str);
}

SocketWrapper.prototype.stopFileStreamAndRenameFile = function(filename){
    this.origFileName = filename;
    this.writeStream.end();
}

SocketWrapper.prototype._doRenameFile = function(){
    var self = this;

    fs.rename( path.join(this.storageDir, this.tmpFileName) , path.join(this.storageDir, this.id + '-' + this.origFileName), function(err){
        if(err) return self.emit('error', err);

        console.log("File successfully renamed".green);
        
        self.emit('fileRenameFinish', self.id);
        self.fileWritten = true;

    });

}


exports.create = function(socket, storageDir, packetParser){
   return new SocketWrapper(socket, storageDir, packetParser);
}
