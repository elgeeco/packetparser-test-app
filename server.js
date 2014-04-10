'use strict';

var net = require('net');
var path = require('path');
var PacketParser = require('packetparser');
var dircleaner = require('dircleaner');
var colors = require('colors');
var maps = require('./lib/mappings');
var SocketWrapper = require('./lib/SocketWrapper');

//------------------------------------------------------
//SETUP
//------------------------------------------------------
var HOST = '127.0.0.1';
var PORT = 3001;
var filepath = path.join(__dirname, 'files_copy');
//------------------------------------------------------

var _sockets = [];

//------------------------------------------------------
//PACKETPARSER SETUP & EVENTS
//------------------------------------------------------
var packetParser = PacketParser.create();
packetParser.config({endTag: '<br/>', delimiter: '</>', mappings: maps});

packetParser.on(PacketParser.EVENT_BASE64_PARSED_DATA, function(base64data, streamID){
    var socketWrapper = _getSocketWrapper(streamID);
    if( typeof socketWrapper !== 'null') socketWrapper.writeToFileStream( base64data );
});

packetParser.on(PacketParser.EVENT_BASE64_PARSING_FINISH,  function(streamID){
    console.log("All Base64 Chunks received for stream with id: %s".magenta, streamID);
});

packetParser.on(PacketParser.EVENT_PACKET_PARSED, function(streamID){
    console.log("Packet parsed for stream with id: %s", streamID);
});

packetParser.on(PacketParser.EVENT_PACKET_PARSING_FINISH,  function(filedata, notes, streamID){
    console.log("All Packets received - Filedata: "  + JSON.stringify( filedata ) );
    var socketWrapper = _getSocketWrapper(streamID);
    if( typeof socketWrapper !== 'null' ) socketWrapper.stopFileStreamAndRenameFile( filedata.filename );
});

packetParser.on(PacketParser.EVENT_PACKET_PARSING_ERROR, function(err){
    console.log("Error Parsing Packets: " + err.message);
});

//------------------------------------------------------
//TCP SOCKET SERVER
//------------------------------------------------------
var server = net.createServer(function(socket){

    var wrapper = SocketWrapper.create(socket, filepath, packetParser);
    _sockets[ wrapper.id ] = wrapper;

    //console.log("Available Socket IDs: "  + Object.keys(_sockets));

    wrapper.on('fileRenameFinish', function(id){
        var socketWrapper = _getSocketWrapper(id);
        if( typeof socketWrapper !== 'null' ){
            wrapper.writeToSocketStream('<msg>packets_transmission_success</>');
        }
    });

    var str = "New Socketconnection with Client: " + socket.remoteAddress + ':' + socket.remotePort;
    console.log( str.magenta);

}).listen(PORT, HOST);

var _getSocketWrapper = function(wrapperID){
    if(_sockets.hasOwnProperty(wrapperID)){
        return _sockets[wrapperID];
    }
    return null;
};

(function init(){
    dircleaner.clean(filepath, true);
})();
