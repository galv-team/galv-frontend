# SPDX-License-Identifier: BSD-2-Clause
# Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.

# By Matt Jaquiery <matt.jaquiery@dtc.ox.ac.uk>

# Download datasets from the REST API.
# Metadata are in dataset_metadata[id] and data are in dataframes[id]
# where id is the UUID of the dataset (listed in dataset_ids).

using Pkg

Pkg.add(["HTTP", "JSON", "CSV", "DataFrames"])
using HTTP
using Downloads
using JSON
using CSV
using DataFrames
using ZipFile

host = "GALV_API_HOST"
token = "GALV_USER_TOKEN"
headers = Dict{String, String}("Authorization" => "Bearer $token")

# Configuration
verbose = true

dataset_ids = String[
    "GALV_DATASET_IDS"
]
dataset_metadata = Dict{String, Dict{String, Any}}()
dataframes = Dict{String, DataFrame}()

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
    
    # Download dataset zip
    zip_url = dataset_metadata[id]["zip_file"]
    vprintln("Downloading zip from $zip_url")

    dataset_dir = mktempdir(prefix="jl_$id")

    zip_data = HTTP.request("GET", zip_url, headers)
    if zip_data.status == 200
        zip_path = joinpath(dataset_dir, "dataset.zip")
        open(zip_path, "w") do f
            write(f, zip_data.body)
        end
        ZipFile.Reader(zip_path) do zr
            for f in zr.files
                write(joinpath(dataset_dir, f.name), read(f))
            end
        end
        vprintln("Dataset downloaded")
    else
        println("Error downloading zip for dataset $id: $(zip_data.status)")
    end

    # Read CSV from directory
    for f in readdir(dataset_dir)
        if endswith(f, ".csv")
            dataframes[id] = CSV.read(joinpath(dataset_dir, f), DataFrame)
        end
    end

    vprintln("Completed.")
end

for id in dataset_ids
    timings = @timed get_dataset(id)
    s = round(timings.time, digits = 2)
    vprintln("Completed dataset $id in $s seconds")
end

vprintln("All datasets complete.")

# Load a dataset as a DataFrame
df = dataframes[dataset_ids[1]]
df
