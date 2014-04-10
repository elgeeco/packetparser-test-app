"use strict";

var maps = {
    attr:{
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
                var day = date.getDate();
                var month = date.getMonth() + 1;
                var year = date.getFullYear();
                var hours = date.getHours();
                var minutes = date.getMinutes();

                return day + '.' + month + '.' + year + ' - ' + hours + ':' + minutes;
            }
        } 
    },
    note:{
        tag: '<notification>'
    }
};

module.exports = maps;
