var xml2js = require("xml2js"),
    _ = require("underscore"),
    fastaParser = require("biojs-io-fasta"),
    fs = require("fs"),
    bioseq = require("bionode-seq");

var blastUtils = module.exports = {};

blastUtils.parseXMLOutput = function(xml, success){
    var parser = new xml2js.Parser(),
        result = [];

    parser.parseString(xml.toString(), function(err, data){
        var hits = data.BlastOutput
                        .BlastOutput_iterations[0]
                        .Iteration[0]
                        .Iteration_hits[0]
                        .Hit;
        _.each(hits, function(el){
            var hsp = el.Hit_hsps[0]
                        .Hsp[0];
            result.push({
                id: el["Hit_id"][0],
                eval: hsp["Hsp_evalue"][0],
                qframe: hsp["Hsp_query-frame"][0]
            });
        });
        success(result);
    })
}

blastUtils.translateQuery = function(query, hits){
    var translated = "";
    var frameMode = mode(_.map(hits, function(el){ return el.qframe; }));

    var frameInd = null;
    switch(parseInt(frameMode)){
        case 1:
            frameInd = 0;
            break;
        case 2:
            frameInd = 1;
            break;
        case 3:
            frameInd = 2;
            break;
        case -1:
            frameInd = 3;
            break;
        case -2:
            frameInd = 4;
            break;
        case -3:
            frameInd = 0;
            break;
    }
    var splithead = query.split("\n");
    var rf = bioseq.getReadingFrames(splithead[1])[frameInd];
    translated = splithead[0] + "\n" + bioseq.translate(rf);

    return translated;
}

blastUtils.filterByEval = function(parsed, cutoff){
    return _.filter(parsed, function(el){
        return parseFloat(el.eval) <= cutoff;
    });
}
blastUtils.getFasta = function(parsed, database, done){
    var fasta = "",
        hit = null,
        db = null,
        id = "";

    fs.readFile(database, "utf-8", function(err, d){
        db = fastaParser.parse(d);
        _.each(parsed, function(el){
            id = el.id.split("\|")[4];
            hit = _.find(db, function(entry){
                return entry.name.trim() === id;
            });
            fasta += ">" + hit.name + "\n";
            fasta += hit.seq + "\n";
        });
        done(fasta);
    });
}

//helpers
function mode(array){
    if(array.length == 0)
    	return null;
    var modeMap = {};
    var maxEl = array[0], maxCount = 1;
    for(var i = 0; i < array.length; i++)
    {
    	var el = array[i];
    	if(modeMap[el] == null)
    		modeMap[el] = 1;
    	else
    		modeMap[el]++;
    	if(modeMap[el] > maxCount)
    	{
    		maxEl = el;
    		maxCount = modeMap[el];
    	}
    }
    return maxEl;
}
