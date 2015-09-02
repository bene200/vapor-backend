var fs = require("fs");
var JSONStream = require("JSONStream");
var es = require("event-stream");
var _ = require("underscore");

var readStream = fs.createReadStream("stringdb-info.json");

readStream.on("open", function(){
	readStream
	.pipe(JSONStream.parse("*"))
	.pipe(es.mapSync(function(obj) {
		nodes = obj.graph.nodes;
		if(nodes){
			for(var j=0; j<nodes.length; j++){
				refids = nodes[j].refids;
				filtered = _.filter(refids, function(e){
					return e.indexOf("_ARATH") !== -1;
				});
				obj.graph.nodes[j].refids = filtered;
			}
		}	
		console.log(JSON.stringify(obj, null, 4));
		}));
});
