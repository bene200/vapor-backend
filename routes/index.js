var express = require("express");
var Transformer = require("/Users/bene1/masters_thesis/biojs-vapor/js/transformer");
var Quickblast = require("/Users/bene1/masters_thesis/quickblast/lib/blast");

var router = express.Router();

/* POST to backend. */
router.post('/', function(req, res, next) {
    var cParser = require("biojs-io-clustal");
    var _ = require("underscore");

    var vap = {
        galaxyURL : "http://localhost:8000",
        apiKey : "0a53aa0a95b3519f5159a9b36a7442f3",
        query: req.body.query
    };
    
    var t = new Transformer(vap.query);

    var sys = require("sys");
    var exec = require("child_process").exec;
    var fs = require("fs");
    var parseNewick = require("tnt.newick").parse_newick;

    var child;
    var blastcmd = "tools/ncbi-blast-2.2.31+/bin/legacy_blast.pl blastall -i tmp/blastin.fasta -p blastp -m 7 -d tools/ncbi-blast-2.2.31+/db/tair/tair --path /usr/local/ncbi/blast/bin";
    fs.writeFile("tmp/blastin.fasta", vap.query, function(err){
        child = exec(blastcmd, function (error, stdout, stderr) {
            var blastresult = stdout;
            var qb = new Quickblast({
                query: vap.query,
                p: "blastp",
                d: "swissprot",
                megablast: true,
                entrezQuery: "Arabidopsis thaliana"
            });
            var fasta = qb.asFasta(blastresult);
            if(fasta.match(/>/g).length > 20){
                lines = fasta.split("\n");
                //every sequence hast 2 lines: header and sequence ->20*2=40
                shortFasta = lines.slice(0, 40).join("\n");
                fasta = shortFasta;
            }
            fs.writeFile("tmp/blastout.fasta", fasta, function(err){
                var clustalcmd = "clustalw2 -INFILE=tmp/blastout.fasta -align -tree -outfile=tmp/clustal.out";
                exec(clustalcmd, function (error, stdout, stderr) {
                    fs.readFile("tmp/clustal.out", { encoding: "utf-8" }, function(err, clustal){
                        fs.readFile("tmp/blastout.dnd", { encoding: "utf-8" }, function(err, newick){
                            var vaporObj = {
                                phylotree: parseNewick(t.shortTreeIDs(newick)),
                                msa: cParser.parse(clustal.replace(/[\:\.\*]/g, ""))
                            }
                            geneIds = t.idsFromFasta(fasta);
                            t.getSTRINGNetworks(geneIds, "", function(nets){
                                vaporObj.interactions = nets;
                                geneIds = geneIds.concat(t.extractNetworkIDs(nets));
                                geneIds = _.uniq(geneIds);
                                //get Swissport data
                                t.getGeneInfo(geneIds, "", function(swissprot){
                                    vaporObj.anno = swissprot;
                                    res.send(vaporObj);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

//SIMPLE GET
router.get('/', function(req, res, next) {
    res.send("yo!");
});

module.exports = router;
