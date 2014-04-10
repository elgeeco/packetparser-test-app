'use strict';

var net = require('net');
var path = require('path');
var fs = require('fs')
var dirreader = require('dirreader');
var colors = require('colors');

//------------------------------------------------------
//SETUP
//------------------------------------------------------
var HOST = '127.0.0.1';
var PORT = 3001;
var NUMBER_SOCKET_CONNECTIONS = 3;
var FILESDIR = 'files_orig';
var NEW_SOCKET_CONNECTION_INTERVAL = 1000;  
//------------------------------------------------------

var _transferCounter = 0;
var _filesObj_arr = [];
var _sockets_arr = [];
var SocketWrapperInstance = function(){
	this.socket = {};
	this.socket.sid = null;
	this.readStream = null;
	this.writeCounter = 0;
	this.filesCounter = -1;
};

(function _createSockets(cnt){

	if( cnt >= NUMBER_SOCKET_CONNECTIONS ){

		dirreader.read(FILESDIR, function(err, files){
			if(err) return console.log(err.message);

			if(files && files.length ){
				_filesObj_arr = files;
				(function _socketSend(cnt){
					setTimeout(function(){
						_sendNextFile(cnt);
						var n = cnt + 1;
						if( n < _sockets_arr.length ) _socketSend(n);
					}, 500);
				})(0);
			}else{
				var str = 'ERROR - Filesdirectory "' + FILESDIR + '" do not exists or has no files';
				console.log( str.red );
			}

		});

		return;	
	}

	var socket = new net.Socket();

	var inst = new SocketWrapperInstance();
	inst.socket = socket;
	inst.socket.sid = cnt;

	_sockets_arr.push(inst);

	inst.socket.setEncoding('utf8');

	inst.socket.connect(PORT, HOST, function(){
		console.log('Connected to: ' + HOST + ':' + PORT);
	});

	inst.socket.on('data', function(data){
		if(typeof data == 'string'){
			if(data.indexOf('<msg>') == 0){
				var msg = data.replace('<msg>', '').replace('</>', '');
				var str = "Receiving message from server: " + msg;
				console.log(str.magenta);
				if(msg == 'packets_transmission_success'){
					var idx = _getSocketWrapperIndex(this);
					if(typeof idx !== 'null') _sendNextFile(idx); 
				}
			}
		}
	});

	inst.socket.on('close', function(){
		console.log('Connection closed');
	});

	inst.socket.on('error', function(){
		console.log('Connection error');
	});

	setTimeout( function(){
		var n = cnt + 1;
		_createSockets( n );
	}, NEW_SOCKET_CONNECTION_INTERVAL);

})(0);

function _sendFileThroughSocket(socketWrapperInstance){

	var fileObj = _filesObj_arr[socketWrapperInstance.filesCounter];
	var filepath = path.join(__dirname, fileObj.path,  fileObj.file);

	var str = "Socket with ID " + socketWrapperInstance.socket.sid + " is sending file to server: " +  filepath;
	console.log("\n" + str.yellow );

	if( typeof socketWrapperInstance.readStream !== 'undefined' && socketWrapperInstance.readStream){
		socketWrapperInstance.readStream.removeAllListeners();
		socketWrapperInstance.readStream = null;
	}

	//READSTREAM & EVENTS
	socketWrapperInstance.readStream = fs.createReadStream(filepath, {encoding: 'base64'});

	socketWrapperInstance.readStream.on('open', function(){
		console.log('Start reading data from file');
	});

	socketWrapperInstance.readStream.on('data', function(chunk){
		console.log("Sending packet to Server with length: " + chunk.toString().length );

		var data = chunk;
		if( socketWrapperInstance.writeCounter == 0 ){	

	        var fileInfosStr = "<id>{id}</><filename>{filename}</><filesize>{filesize}</><timestamp>{timestamp}</>";
	        fileInfosStr = fileInfosStr.replace('{id}', Math.round(Math.random() * 100 ));
	        fileInfosStr = fileInfosStr.replace('{filename}', fileObj.file );
	        fileInfosStr = fileInfosStr.replace('{filesize}', fileObj.size );
	        fileInfosStr = fileInfosStr.replace('{timestamp}', Math.round(new Date().getTime() / 1000) ); 
	        data = fileInfosStr + '<data>' + data;
		}
		socketWrapperInstance.writeCounter++;

		socketWrapperInstance.socket.write(data);
		
	});

	socketWrapperInstance.readStream.on('error', function(err){
		console.log("Stream error");
	});

	socketWrapperInstance.readStream.on('end', function(){
		console.log("All packets send");
		socketWrapperInstance.socket.write('</><br/>');
	});
	
};


function _sendNextFile(socketIdx){
	var socketInst = _sockets_arr[socketIdx];
	if( !socketInst ) return;

	console.log( "Send Next File Over Socket SID: " + socketInst.socket.sid  );

	socketInst.writeCounter = 0;
	socketInst.filesCounter++;

	if( socketInst.filesCounter < _filesObj_arr.length ){
		setTimeout(function(){
			_sendFileThroughSocket(socketInst);
		}, 1000);
	}else{
		var str = "All Files Transmitted over Socket with ID: " + socketInst.socket.sid;
		console.log("\n" + str.green);
		_transferCounter++;
		if( _transferCounter >= _sockets_arr.length ){
			console.log("\nFiles Transmission Completed".green);
		}
	}
};


function _getSocketWrapperIndex(socket){
	for( var i=0; i< _sockets_arr.length; i++){
		if( socket === _sockets_arr[i].socket ){
			return i;
		}
	}
	return null;
};
