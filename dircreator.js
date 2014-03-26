'use strict';

var fs = require('fs');

var deleteFolderRecursive = function(path) {
    if( fs.existsSync(path) ) {
        fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
                deleteFolderRecursive(curPath);
            } else { // delete file
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(path);
    }
};


exports.createdir = function(path){
    deleteFolderRecursive(path);

    if(fs.existsSync( path )) {
        deleteFolderRecursive(path);
    }

    if(!fs.existsSync( path )){
        fs.mkdirSync(path,  function(err){
            if(err) return console.log(err.message);
        });
    }
}