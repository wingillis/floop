#!/bin/bash

find /Users/wgillis/db-hms/library/floop -name "*.pdf" -exec mv {} ~/db-hms/lab-datta/papers\ to\ read/ \;
cd /Users/wgillis/db-hms/library/floop
ls | xargs -n 1 rmdir
