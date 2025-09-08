# SPDX-License-Identifier: BSD-2-Clause
# Copyright (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.
#
# By Matt Jaquiery <matt.jaquiery@dtc.ox.ac.uk>

import os
import requests
import json
import io
import zipfile
import pandas as pd
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
dataframes = {}


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
    zip_url = dataset_metadata[id]["zip_file"]
    vprintln(f"Downloading dataset zip from {zip_url}")

    dataset_dir = tempfile.mkdtemp(prefix=f"py_{id}")

    download_response = requests.get(zip_url, headers=headers)
    if download_response.status_code == 200:
        with zipfile.ZipFile(io.BytesIO(download_response.content)) as zf:
            zf.extractall(dataset_dir)
        vprintln("Dataset downloaded successfully")
    else:
        print(f"Error downloading zip for dataset {id}: {download_response.status_code}")

    # Read CSV from directory
    csv_path = next(
        (p for p in os.listdir(dataset_dir) if p.endswith('.csv')),
        None,
    )
    if csv_path:
        dataframes[id] = pd.read_csv(os.path.join(dataset_dir, csv_path))
    vprintln("Completed.")


for id in dataset_ids:
    get_dataset(id)
    vprintln(f"Completed dataset {id}")

vprintln("All datasets complete.")

# Load a dataset as a DataFrame
df = dataframes[dataset_ids[0]]
print(df)
