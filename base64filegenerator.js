"use strict";

/*
* Methode um ein base64 String in einzelne Teile zu splitten
*@param base64Str 		string 		
*@param randomChunkSize	true|false default:false
*@param chunkFactor4	true|false default:false
*@param minExplodes		int        default:5	
*@param maxExplodes		int        default:10
*/

exports.divideIntoChunks = function(base64Str, randomChunkSize, chunkFactor4, minExplodes, maxExplodes){

	minExplodes 	= minExplodes || 5;
	maxExplodes 	= maxExplodes || 10;
	randomChunkSize = (!randomChunkSize) ? false : true; 
	chunkFactor4 	= (!chunkFactor4) ? false : true;

	if( minExplodes > maxExplodes ) maxExplodes = minExplodes;

	var explodes = minExplodes + Math.round((Math.random() * (maxExplodes - minExplodes)));

	var arr = [];
	var charLength = Math.floor(base64Str.length / explodes);

	var startPos = 0;

	for(var i=0; i < explodes; i++){

		var s = '';

		if( i == (explodes - 1) ){
			s = base64Str.substring( startPos );
		}else{
			var subtractNum = (randomChunkSize) ? Math.floor(Math.random() * charLength) : 0;
			var endPos = (i * charLength + charLength ) - subtractNum;
			
			if(chunkFactor4){
				var rest = endPos % 4;
				if( rest != 0){
					endPos = endPos - rest;
				} 
			}

			//console.log( startPos + ' : ' + endPos +  ' : ' + (endPos - startPos) );
			s = base64Str.substring( startPos, endPos );
			startPos = endPos;
		}

		arr.push(s);
	}

	return arr;

}

exports.pdfIcon = function(){
	return {
		filename: 'pdficon.gif',
		filetype: 'gif',
		data:["R0lGODlhBgAHAMQAAIuUlLZQTaKoqN/t7ujq6uji36Sop/mFhbGfnv",
			"WRkaVrbPlzc46SjPtZWcZQTq2zr+HV1fGoqOddXMiGgdIwMIKIiW1ta",
			"tItLqhqY66TlKiXlMaFgKx/eaerq8TOzoqOjiH5BAAAAAAALAAAAAAGA",
			"AcAAAUj4ON5GVZw27QhjHNRAdQZAyQRQlccTaJli0ghodBwAJ+KJQQAOw=="].join("")
	}
}

exports.pdfImage = function(){
	return {
		filename: 'pdfimage.gif',
		filetype: 'gif',
		data:["R0lGODlhDQALANUAAP////b29u/v7+Xl5fLd3eLY2OnR0e/Cwuy+vsbGss",
			"LCwru7u7i4pPOlpbS0tLOzn6urq/GPj8GZmeyHh9uHh5iYhJWVjfZxcYuL",
			"i/Vra4ODg8lxcal2dnx8fPlZWXZ2dvhTU41pafVMTIFlZWZmZv8zM1xcXF",
			"JSUk5OTv8AAP///wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAUUACoALAAAAAAN",
			"AAsAAAZbQJXKgtF0jgmhUoUBOAGpD2NpqVotCtJDaUl5vRaBw8TlmM1hxWnZ",
			"CQQEpcNgsVa2BY1UZF4XdggXIAggIhJ9KiEeGQYDBRMbhyMUCgsLDhAaKFQmJ52dKBVCQQA7"].join("")
		}
}

exports.lockImage = function(){
	return {
		filename: 'lockimage.gif',
		filetype: 'gif',
		data:["R0lGODlhEAAQANUjAN2wP96yRrmNIe/apdqoLd+0SLaLIbuPIdurM86eJbGHIK",
			"2EH+zTlNurMsSWI7iNIbOJINqpMMycJMKUI9urNdqoK8WXI9mmJ6yEH+O9YL6R",
			"IseYJNWjJtilJuzTk+O+YejJe9GgJaqCHv///wAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
			"AAAAAAAAAAAAAAAAAAAAAAAACH5BAEAACMALAAAAAAQABAAAAZiwJFwSCwaj8gk",
			"8iNqfpTMkFT0RIqko2nyOgyJjhQE4cIJSSyTw6OICHxAnoEHlCkYig0BAD5ggA",
			"ACEEURbnAicx8FCkUEenAJc4ALjIVxiAEYRRUdCRsOGgcGCgtfSqanI0EAOw=="].join("")
		}
}



