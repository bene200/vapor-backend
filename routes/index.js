var express = require("express");
var Transformer = require("../node_modules/vapor/transformer");
var butils = require("../test/blast-utils")
var router = express.Router();
var fs = require("fs");
var JSONStream = require("JSONStream");
var es = require("event-stream");
var _ = require("underscore");
var readJSON = require("read-json");

/* POST to backend. */
router.post('/', function(req, res, next) {
    var faParser = require("biojs-io-fasta");
    var _ = require("underscore");

    var vap = {
        query: req.body.query,
        eval: req.body.eval
    };

    var t = new Transformer(vap.query);

    var sys = require("sys");
    var exec = require("child_process").exec;
    var sh = require("shelljs");

    var parseNewick = require("tnt.newick").parse_newick;
    var child;
    var blastresult = "";
    var blastcmd = "tools/ncbi-blast-2.2.31+/bin/blastx -query tmp/blastin.fasta -outfmt 5 -db data/db/tair/tair";
    
    fs.writeFile("tmp/blastin.fasta", vap.query, function(err){
        blastresult = sh.exec(blastcmd, {silent: true}).output;
	
        if(blastresult){
            butils.parseXMLOutput(blastresult, function(resp){
                var filtered = butils.filterByEval(resp, vap.eval);
                if(filtered.length === 0){
                    res.send("NA");
                }
                else {
                    butils.getFasta(filtered, "data/db/tair/tair.fasta", function(fa){
                        var fasta = butils.translateQuery(vap.query, filtered) + "\n" + fa;
                        fs.writeFile("tmp/blastout.fasta", fasta, function(err){
                            var clustalcmd = "tools/clustalo -i tmp/blastout.fasta --outfmt=fa -o tmp/clustal.out";
                            var njcmd = "tools/ninja_1.2.1/ninja --in_type a tmp/clustal.out";
			    exec(clustalcmd, function (error, stdout, stderr) {
				
				var treeOut = sh.exec(njcmd, {silent: true}).output;
				var treeInd = treeOut.search(/\(.*;/g);
				var ninjaTree = treeOut.substring(treeInd, treeOut.length-1);
                                fs.readFile("tmp/clustal.out", { encoding: "utf-8" }, function(err, clustal){
					var newick = ninjaTree;
				
					var vaporObj = {
					    phylotree: parseNewick(newick),
					    msa: faParser.parse(clustal)
					};
					geneIds = t.idsFromFastaSimple(fasta);
					console.log("parsing string");
					stringdbStream(geneIds, function(nets){
					    console.log("string parsing finished");
					    vaporObj.interactions = nets;
					    geneIds = geneIds.concat(t.extractNetworkIDs(nets));
					    geneIds = _.uniq(geneIds);
					    console.log("parsing uniprot");
					    swissprot(geneIds, function(sp){
						vaporObj.anno = sp;
						console.log("parsing the expression data");
						expression(sp, function(expr){
						    vaporObj.expr = expr;
						    res.send(vaporObj);
						});
					    });
					});
                                });
                            });
                        });
                    });
                }
            });
        }
    });
});

//SIMPLE GET
router.get('/', function(req, res, next) {
    res.send("yo!");
});

//helper functions
//probably do not belong here and should be moved at a later stage

function swissprot(geneIds, success){   
    fs.readFile("data/uniprot-info.json", "utf-8", function(err, data){
        
	var anno = JSON.parse(data);
        var result = [];
        var match = null;
	
        for(var i=0; i<geneIds.length; i++){
            match = _.findWhere(anno, {query: geneIds[i]});
            if(!match){
                match = _.where(anno, {locusname: geneIds[i]})[0];
            }
            result.push(match);
        }
        success(result);
    });
}

function stringdbStream(geneIds, success){
    var anno = [];
    var results = [];
    finished = _.after(10, function(){ 
        var match = null;
        for(var i=0; i<geneIds.length; i++){
            match = _.findWhere(anno, {query: geneIds[i]});
            if(!match){
                match = {
                    query: geneIds[i],
                    graph: {
                        nodes: [],
                        edges: []
                    }
                };
            }
            results.push(match);
        }     
	success(results); 
    });   
    for(var i=0; i<10; i++){
        readJSON("data/stringdb/part" + i + ".json", function(err, data){ 
            anno.push(data);
            finished();
        });
    } 
}

function stringdb(geneIds, success){
    readJSON("data/filtered2-string.json", function(err, anno){
        console.log("hi2");
	//var anno = JSON.parse(data);
        var result = [];
        var match = null;
	console.log("hi3");
        for(var i=0; i<geneIds.length; i++){
            match = _.findWhere(anno, {query: geneIds[i]});
            if(!match){
                match = {
                    query: geneIds[i],
                    graph: {
                        nodes: [],
                        edges: []
                    }
                };
            }
            result.push(match);
        }
	console.log("hi4");
        success(result);
    });
}

function splitParts(a, n) {
    var len = a.length,out = [], i = 0;
    while (i < len) {
        var size = Math.ceil((len - i) / n--);
        out.push(a.slice(i, i += size));
    }
    return out;
}

function expression(swissprot, success){
    fs.readFile("data/expression_data.tsv", "utf-8", function(err, data){
        var result = [];
        var lines = data.split("\n");
        var match = null;
        for(var i=0; i<swissprot.length; i++){
            if(swissprot[i] !== undefined){
                match = _.filter(lines, function(e){ return e.substring(0, 9) === swissprot[i].locusname});
                if(match !== null && match.length > 0){
                    match = match[0].split("\t");
                    result.push({
                        query: swissprot[i].query,
                        flower: match[1],
                        leaves: match[2],
                        roots: match[3],
                        stem: match[4]
                    })
                }
            }
        }
        success(result);
    });
}

module.exports = router;
