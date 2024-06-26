# SPDX-License-Identifier: BSD-2-Clause
# Copyright (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.
#
# By Matt Jaquiery <matt.jaquiery@dtc.ox.ac.uk>

import os
import requests
import json
import pyarrow.parquet as pq
import tempfile

# Configuration
host = "GALV_API_HOST"
token = "GALV_USER_TOKEN"
headers = {
    "Authorization": f"Bearer {token}",
    "accept": "application/json"
}
verbose = True

dataset_ids = [
    "GALV_DATASET_IDS"
]
dataset_metadata = {}
parquets = {}


def vprintln(message):
    if verbose:
        print(message)


def get_dataset(id):
    vprintln(f"Downloading dataset {id}")

    response = requests.get(f"{host}/files/{id}/", headers=headers)
    if response.status_code != 200:
        print(f"Error fetching dataset {id}: {response.status_code}")
        return

    try:
        body = response.json()
    except json.JSONDecodeError:
        print(f"Error parsing JSON for dataset {id}")
        return

    dataset_metadata[id] = body
    parquet_partitions = dataset_metadata[id]["parquet_partitions"]
    len_partitions = len(parquet_partitions)
    vprintln(f"Downloading {len_partitions} parquet partitions for dataset {id}")

    dataset_dir = tempfile.mkdtemp(prefix=f"py_{id}")

    for i, pp in enumerate(parquet_partitions):
        vprintln(f"Downloading partition {i + 1} from {pp}")
        partition_response = requests.get(pp, headers=headers)
        if partition_response.status_code != 200:
            print(f"Error fetching parquet partition {i + 1} for dataset {id}: {partition_response.status_code}")
            continue

        try:
            parquet_info = partition_response.json()
        except json.JSONDecodeError:
            print(f"Error parsing JSON for dataset {id} parquet partition {i + 1}")
            continue

        pq_file = parquet_info["parquet_file"]
        vprintln(f"Downloading .parquet from {pq_file}")
        path = os.path.join(dataset_dir, f"{i + 1}.parquet")

        download_response = requests.get(pq_file, headers=headers)
        if download_response.status_code == 200:
            with open(path, 'wb') as f:
                f.write(download_response.content)
            vprintln(f"Partition {i + 1} downloaded successfully")
        else:
            print(f"Error downloading .parquet file from {pq_file}: {download_response.status_code}")

    # Add parquet from directory
    parquets[id] = pq.ParquetDataset(dataset_dir)
    vprintln("Completed.")


for id in dataset_ids:
    get_dataset(id)
    vprintln(f"Completed dataset {id}")

vprintln("All datasets complete.")

# Load a dataset as a DataFrame
df = parquets[dataset_ids[0]].read().to_pandas()
print(df)
