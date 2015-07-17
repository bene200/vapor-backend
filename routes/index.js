var express = require("express");
var Transformer = require("/Users/bene1/masters_thesis/biojs-vapor/js/transformer");
var butils = require("../test/blast-utils")
var router = express.Router();

/* POST to backend. */
router.post('/', function(req, res, next) {
    var cParser = require("biojs-io-clustal");
    var _ = require("underscore");

    var vap = {
        query: req.body.query,
        eval: req.body.eval
    };

    var t = new Transformer(vap.query);

    var sys = require("sys");
    var exec = require("child_process").exec;
    var sh = require("shelljs");
    var fs = require("fs");
    var parseNewick = require("tnt.newick").parse_newick;
    var child;
    var blastresult = "";
    var blastcmd = "tools/ncbi-blast-2.2.31+/bin/legacy_blast.pl blastall -i tmp/blastin.fasta -p blastx -m 7 -d data/db/tair/tair --path /usr/local/ncbi/blast/bin";
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
                            var clustalcmd = "clustalw2 -INFILE=tmp/blastout.fasta -align -tree -outfile=tmp/clustal.out";
                            exec(clustalcmd, function (error, stdout, stderr) {
                                fs.readFile("tmp/clustal.out", { encoding: "utf-8" }, function(err, clustal){
                                    fs.readFile("tmp/blastout.dnd", { encoding: "utf-8" }, function(err, newick){
                                        var vaporObj = {
                                            phylotree: parseNewick(newick),
                                            msa: cParser.parse(clustal.replace(/[\:\.\*]/g, ""))
                                        };
                                        geneIds = t.idsFromFastaSimple(fasta);
                                        stringdb(geneIds, fs, function(nets){
                                            vaporObj.interactions = nets;
                                            geneIds = geneIds.concat(t.extractNetworkIDs(nets));
                                            geneIds = _.uniq(geneIds);
                                            swissprot(geneIds, fs, function(sp){
                                                vaporObj.anno = sp;
                                                expression(sp, fs, function(expr){
                                                    vaporObj.expr = expr;
                                                    res.send(vaporObj);
                                                });
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

function swissprot(geneIds, fs, success){
    var _ = require("underscore");
    fs.readFile("data/uniprot-info.json", "utf-8", function(err, data){
        var anno = JSON.parse(data);
        var result = [];
        var match = null;
        for(var i=0; i<geneIds.length; i++){
            match = _.where(anno, {query: geneIds[i]})[0];
            if(!match){
                match = _.where(anno, {locusname: geneIds[i]})[0];
            }
            result.push(match);
        }
        success(result);
    });
}

function stringdb(geneIds, fs, success){
    var _ = require("underscore");

    fs.readFile("data/stringdb-info.json", "utf-8", function(err, data){
        var anno = JSON.parse(data);
        var result = [];
        var match = null;
        for(var i=0; i<geneIds.length; i++){
            match = _.where(anno, {query: geneIds[i]})[0];
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

function expression(swissprot, fs, success){
    var _ = require("underscore");
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
