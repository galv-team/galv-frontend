# SPDX-License-Identifier: BSD-2-Clause
# Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.

# By Matt Jaquiery <matt.jaquiery@dtc.ox.ac.uk>

# Download datasets from the REST API.
# Metadata are in dataset_metadata[id] and data are in [parquets[id]
# where id is the UUID of the dataset (listed in dataset_ids).

using Pkg

Pkg.add(["HTTP", "JSON", "Parquet2"])
using HTTP
using Downloads
using JSON
using Parquet2: Dataset, appendall!
using DataFrames

host = "GALV_API_HOST"
token = "GALV_USER_TOKEN"
headers = Dict{String, String}("Authorization" => "Bearer $token")

# Configuration
verbose = true

dataset_ids = String[
    "GALV_DATASET_IDS"
]
dataset_metadata = Dict{String, Dict{String, Any}}()
parquets = Dict{String, Dataset}()

function vprintln(s)
    if verbose
        println(s)
    end
end


function get_dataset(id)
    vprintln("Downloading dataset $id")
    
    response = HTTP.request("GET", "$host/files/$id/", headers)
    body = Dict{String, Any}()

    try
        body = JSON.parse(String(response.body))
    catch
        println("Error parsing JSON for dataset $id")
        return
    end
    dataset_metadata[id] = body
    
    # Download parquets
    parquet_partitions = dataset_metadata[id]["parquet_partitions"]
    len = length(parquet_partitions)
    vprintln("Downloading $len parquet_partitions for dataset $id")

    dataset_dir = mktempdir(prefix="jl_$id")
    
    for (i, pp) in enumerate(parquet_partitions)
        vprintln("Downloading partition $i from $pp")
        partition = HTTP.request("GET", pp, headers)
        parquet = Dict{String, Any}()
    
        try
            parquet = JSON.parse(String(partition.body))
        catch
            println("Error parsing JSON for dataset $id parquet partition $i")
        end
        pq_file = parquet["parquet_file"]
        vprintln("Downloading .parquet from $pq_file")
        path = joinpath(dataset_dir, "$i.parquet")
        timings = @timed Downloads.download(pq_file, path, headers=headers)
        s = round(timings.time, digits = 2)
        vprintln("Partition $i downloaded in $s seconds")
    end

    # Add parquet from directory
    parquets[id] = Dataset(dataset_dir)
    # If you want to filter by columns, etc. then don't appendall here. This is to demonstrate loading everything.
    appendall!(parquets[id])

    vprintln("Completed.")
end

for id in dataset_ids
    timings = @timed get_dataset(id)
    s = round(timings.time, digits = 2)
    vprintln("Completed dataset $id in $s seconds")
end

vprintln("All datasets complete.")

# Load a dataset as a DataFrame
df = DataFrame(parquets[dataset_ids[1]]; copycols=false)  # copycols=false unless you want to write to df
df
