#!/bin/bash

#search swissprot
~/masters_thesis/vapor/vapor-backend/tools/ncbi-blast-2.2.31+/bin/legacy_blast.pl blastall -p blastp -m 7 -i ~/masters_thesis/data/test_putative.fa -o test.out -d ~/masters_thesis/vapor/vapor-backend/tools/ncbi-blast-2.2.31+/db/swissprot/swissprot --path /usr/local/ncbi/blast/bin

#extract tair data
/usr/local/ncbi/blast/bin/blastdbcmd -db ../db/swissprot/swissprot -entry all -outfmt "%g %T" | awk '{if($2==3702) {print $1} }' | /usr/local/ncbi/blast/bin/blastdbcmd -db ../db/swissprot/swissprot -entry_batch - -out tair_sequences.txt

#remove duplicates
sed -e '/^>/s/$/@/' -e 's/^>/#/' tair_short_header.fasta | tr -d '\n' | tr "#" "\n" | tr "@" "\t" | sort -u -t ' ' -f -k 2,2 | sed -e 's/^/>/' -e 's/\t/\n/' > tair.fasta

#make database from tair tair_sequences
/usr/local/ncbi/blast/bin/makeblastdb -in tair.fasta -input_type fasta -dbtype prot -parse_seqids -out tair