# SPDX-License-Identifier: BSD-2-Clause
# Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.

# By Matt Jaquiery <matt.jaquiery@dtc.ox.ac.uk>

# Download datasets from the REST API.
# Downloads all data for all columns for the dataset and reads them
# into a Dict object. Data are under datasets[x] as DataFrames.
#
# Dataset and column dataset_metadata are under dataset_metadata[x] and
# column_metadata[x] respectively.
import time
import re
import pandas

import galv  # install via `pip install galv` if not available
from galv.apis import tag_to_api

# Configuration
verbose = True

VARS = {
    "api_host": "GALV_API_HOST",
    "user_token": "GALV_USER_TOKEN",
    "dataset_ids": [
        "GALV_DATASET_IDS"
    ]
}

headers = {'Authorization': f'Bearer {VARS["user_token"]}'}

# Add additional dataset ids to download additional datasets
dataset_metadata = {}  # Will have keys=dataset_id, values=DynamicSchema of dataset metadata
column_metadata = {}  # Will have keys=dataset_id, values=List of DynamicSchemas of column metadata
data = {}  # Will have keys=dataset_id, values=pandas DataFrame of data

# Set up the connection configuration
config = galv.Configuration(host=VARS['api_host'])
config.access_token = VARS['user_token']

# Download data
start_time = time.time()
successes = 0
if verbose:
    print(f"Downloading {len(VARS['dataset_ids'])} datasets from {VARS['api_host']}")

with galv.ApiClient(config) as api_client:  # Enter a context with an instance of the API client
    # Set up the specific API classes we need
    files_api = tag_to_api.FilesApi(api_client)
    columns_api = tag_to_api.ColumnsApi(api_client)

    for dataset_id in VARS['dataset_ids']:
        dataset_start_time = time.time()
        try:
            if verbose:
                print(f"Downloading dataset {dataset_id}")
                files_api = tag_to_api.FilesApi(api_client)  # Get the specific API class we need
                r = files_api.files_retrieve({"uuid": dataset_id})  # Call the API method to retrieve the dataset
                # Response.response contains the raw response information
                if r.response.status != 200:
                    raise Exception((
                        f"Failed to download dataset {dataset_id}. "
                        f"HTTP{r.response.status}: {r.response.reason}"
                    ))
                # Response.body contains the response body
                dataset_metadata[dataset_id] = r.body

            columns = dataset_metadata[dataset_id].get('columns', [])

            if verbose:
                print(f"Dataset {dataset_id} has {len(columns)} columns to download")

            # Download the data from all columns in the dataset
            data[dataset_id] = pandas.DataFrame()
            column_metadata[dataset_id] = [None] * len(columns)

            for i, column in enumerate(columns):
                # Extract id from column URL
                column_id = re.search(r'/(\d+)/(\??.*)$', column).group(1)
                if verbose:
                    print(f"Downloading dataset {dataset_id} column {i}")
                c = columns_api.columns_retrieve({"id": int(column_id)})
                if c.response.status != 200:
                    raise Exception((
                        f"Failed to download column {column}. "
                        f"HTTP{r.response.status}: {r.response.reason}"
                    ))
                column_metadata[dataset_id][i] = c.body
                v = columns_api.columns_values_retrieve({"id": int(column_id)})
                if c.response.status != 200:
                    raise Exception((
                        f"Failed to download data for column {column}. "
                        f"HTTP{r.response.status}: {r.response.reason}"
                    ))
                # Values are fetched as a stream of bytes, so we need to decode them.
                # Values are fetched as a stream of bytes, so we need to decode them.
                d = str(v.response.data, encoding='utf-8')
                data[dataset_id][c.body["name_in_file"]] = d.split('\n')

            if verbose:
                print((
                    f"Finished downloading dataset {dataset_id} in "
                    f"{round(time.time() - dataset_start_time, 2)}s"
                ))
            successes += 1

        except Exception as e:
            print(f"Error downloading dataset {dataset_id}. {e.__class__.__name__}: {e}")

if verbose:
    print((
        f"Successfully downloaded {successes}/{len(VARS['dataset_ids'])} datasets "
        f"in {round(time.time() - start_time, 2)}s\n\n"
        "Dataset metadata is in dataset_metadata, column metadata is in column_metadata, "
        "and data are in data.\n\n"
        "All are dictionaries with dataset_id keys and DynamicSchema/DataFrame values."
    ))
