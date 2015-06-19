var fs = require("fs");
var _ = require("underscore");

var geneList = ["LEUD1_ARATH", "IPMI2_ARATH"];

fs.readFile("../data/uniprot-info.json", "utf-8", function(err, data){
    var anno = JSON.parse(data);
    console.log(anno.length);
    var result = [];
    var match = null;
    for(var i=0; i<geneList.length; i++){
        match = _.where(anno, {query: geneList[i]})[0];
        console.log(match);
        result.push(match);
    }
    return result;
});