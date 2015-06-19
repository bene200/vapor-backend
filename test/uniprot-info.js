var fs = require("fs"),
    Transformer = require("/Users/bene1/masters_thesis/biojs-vapor/js/transformer");

fs.readFile("test.headers", "utf-8", function(err, body){
    var t = new Transformer("");
    var headers =  t.idsFromFasta(body);
    //headers = headers.slice(0, 101); //just for test purposes
    for(var i=0; i<headers.length; i++){
        headers[i] = headers[i].replace(/ H/g, "");
    }
    var threads = 8;
    var container = splitParts(headers, threads);
    fs.writeFile("results/uniprot-info.json", "", function(err){
        for(var i=0; i<container.length; i++){
            t.getGeneInfo(container[i], "", function(swissprot){
                fs.appendFile("results/uniprot-info.json", JSON.stringify(swissprot, null, 4), function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("JSON saved to uniprot-info.json");
                    }
                });
            });
        }
    });
});

function splitParts(a, n) {
    var len = a.length,out = [], i = 0;
    while (i < len) {
        var size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i += size));
    }
    return out;
}