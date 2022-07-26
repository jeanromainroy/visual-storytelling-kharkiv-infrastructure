# import libs
import sys
import json

# grab input arguments
filename = sys.argv[1]
datapath = sys.argv[2]

# create outpath
OUTPATH = filename + '.json'

# load json data from file 
with open(datapath, 'r') as f:
    data = json.load(f)

# grab relevant info
size = data['size']
wgs84Extent = data['wgs84Extent']
dataframe = { 'size': size, 'wgs84Extent': wgs84Extent }

# dump to file
with open(OUTPATH, 'w') as f:
    json.dump(dataframe, f)

# log
print(OUTPATH)
