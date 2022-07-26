# import libs
import os
import json

# constants
OUTPATH = './info.json'

# init dataframe
dataframe = []

# list out all json files
filepaths = [filepath for filepath in os.listdir('./') if '.json' in filepath]

# sort
filepaths.sort()

# go through files
for filepath in filepaths:

    # load data
    with open(filepath, 'r') as f:
        data = json.load(f)

    # convert to name
    filename = filepath.split('.')[0]

    # set name
    data['filename'] = filename

    # push to dataframe
    dataframe.append(data)

# save to file
with open(OUTPATH, 'w') as f:
    json.dump(dataframe, f)

# log
print(f'All raster data saved at {OUTPATH}')