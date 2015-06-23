var Qb = require("../lib/blast");

seq = ">candidate\nMGWHQILGLLPFLLLLHSSIPFASPLCPPDQHDSLLHFRNSFVLDVMAS\
DYCHSHYPYYPKTNSWNKAVDCCLWGGVTCDNVTGNVINLDLTCSTGFTGEIPSSICQLSSLKFLHLS\
NNNLSGNMPPCFGNLSNLVDLDLSNNILQGSLPRTLVKCVKLSSLDLSHSKFRPIPLPSPVTIYYSIA\
RNNFVGKIPSLICNATKLEMIDSSNNGLTSSLPPCITNFSTHLSILSLGMNYLEGIIPQSLSWRSGLM\
TLDLSQNRFEGKLPRSLEKCEFLEILDL";

qb = new Qb({
    query: seq,
    p: "blastp",
    d: "swissprot",
    entrezQuery: "Arabidopsis thaliana",
    megablast: true
});

qb.search(function(){
    var fasta = qb.asFasta(),
        headers = fasta.match(/>.+\n/g),
        seqs = fasta.match(/\n.+\n/g);
    console.log(fasta);
});