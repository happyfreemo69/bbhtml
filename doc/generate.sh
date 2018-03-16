#!/bin/bash
#called from Makefile
grep 'test(' tests/lib/parser.js|sed -r 's/^\s+/    /' > doc/_covers.txt
node -e "x=n=>fs.readFileSync(n).toString();c=x('doc/_covers.txt');r=x('doc/README.tpl').replace('{{COVERAGE}}',c);fs.writeFileSync('README.md',r)"


