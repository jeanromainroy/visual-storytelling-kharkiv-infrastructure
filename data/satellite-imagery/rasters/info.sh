#!/bin/bash

# constants
PYSCRIPT1=info-1.py
PYSCRIPT2=info-2.py
TMPPATH=gdalinfo.txt

# remove tmp files
rm $TMPPATH
rm *.txt
rm *.json

# loop through all .tif
for FILEPATH in $(ls *.tif)
do

    # run GDAL Info
    DATA=$(gdalinfo -noct -norat -nomd -nogcp -json "$FILEPATH")

    # save output to tmp file
    echo $DATA > $TMPPATH

    # pass to python to parse json
    python3 $PYSCRIPT1 $FILEPATH $TMPPATH

done


# combine all jsons together using python
python3 $PYSCRIPT2

# remove tmp files
rm $TMPPATH
rm *.txt
rm *.xml
rm *.tif.json
