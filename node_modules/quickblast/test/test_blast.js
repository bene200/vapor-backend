//Mocha unit tests for the quickblast module

var assert = require("assert");
var Qb = require("../lib/blast");

describe("Blast", function(){
    var seqMain = ">test\nIYNSIVTTHAFVMIFFFVMP";
    var qb = new Qb({
        query: seqMain, 
        p: "blastp", 
        d: "swissprot"
    });

    it("should be robust to bad input", function(done){
        var seq = "MEFMEFMEQEFEOP";
        assert.throws(function(){
            new Qb({
                query: seq, 
                p: "blastp", 
                d: "nr"
            });
        }, /fasta input needs to have a header/);
        seq = ">test\nABLKDLFJLLSKDJF";
        assert.throws(function(){
            new Qb({
                query: seq, 
                p: "some", 
                d: "nr"
            });
        }, /invalid program/);
        assert.throws(function(){
            new Qb({
                query: seq, 
                p: "blastp", 
                d: "some"
            });
        }, /invalid database/);
        var seq2 = ">test\nABC\n>test2\nABC";
        // assert.throws(function(){
        //     new Qb(seq2, "blastp", "nr");
        // }, /you can only have one input sequence/);
        assert.throws(function(){
            new Qb({
                query: 23, 
                p: "blastp", 
                d: "nr"
            });
        }, /sequence not of type string/);
        assert.doesNotThrow(function(){
            new Qb({
                query: seq, 
                p: "blastp", 
                d: "nr"
            });
        });

        done();
    });

    describe("search", function(){
        this.timeout(60000);
        it("should perform a BLAST search and get a result", function(done){
            seq = ">test\nIYNSIVTTHAFVMIFFFVMP";
            qb = new Qb({
                query: seq, 
                p: "blastp", 
                d: "swissprot"
            });
            qb.search(function(){
                assert.notEqual(qb.getOutput(), "");

                done();
            });
        });
        it("should be able to do an organism specific serach", function(done){
            seq = ">candidate\nMGWHQILGLLPFLLLLHSSIPFASPLCPPDQHDSLLHFRNSFVLDVMAS\
            DYCHSHYPYYPKTNSWNKAVDCCLWGGVTCDNVTGNVINLDLTCSTGFTGEIPSSICQLSSLKFLHLS\
            NNNLSGNMPPCFGNLSNLVDLDLSNNILQGSLPRTLVKCVKLSSLDLSHSKFRPIPLPSPVTIYYSIA\
            RNNFVGKIPSLICNATKLEMIDSSNNGLTSSLPPCITNFSTHLSILSLGMNYLEGIIPQSLSWRSGLM\
            TLDLSQNRFEGKLPRSLEKCEFLEILDL";
            qb = new Qb({
                query: seq,
                p: "blastp",
                d: "swissprot",
                entrezQuery: "Arabidopsis thaliana"
            });
            assert.doesNotThrow(function(){
                qb.search(function(){
                    assert.notEqual(qb.getOutput(), "");

                    done();
                });
            });
        });
    });

    describe("asFasta", function(){
        it("should transform the xml blast output to a correct fasta file", function(done){
            var fasta = qb.asFasta();
            var headers = fasta.match(/>.+\n/g);
            assert.notEqual(headers, null);
            var seqs = fasta.match(/\n.+\n/g);
            assert.notEqual(seqs, null);
            assert.equal(headers.length, seqs.length);

            done();
        });
    });
});