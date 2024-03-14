# SPDX-License-Identifier: BSD-2-Clause
# Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
# of Oxford, and the 'Galv' Developers. All rights reserved.

# By Matt Jaquiery <matt.jaquiery@dtc.ox.ac.uk>

# Download datasets from the REST API.
# Downloads all data for all columns for the dataset and reads them
# into a Dict object. Data are under datasets[x] as DataFrames.
#
# Dataset and column metadata are under dataset_metadata[x] and 
# column_metadata[x] respectively.

using Pkg

Pkg.add(["HTTP", "JSON", "DataFrames"])
using HTTP
using JSON
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
column_metadata = Dict{String, Dict{Int64, Any}}()
datasets = Dict{String, DataFrame}()

function vprintln(s)
    if verbose
        println(s)
    end
end

function get_column_values(dataset_id, column)
    url = column["values"]
    if url == ""
        return
    end

    column_name = column["name"]
    dtype = column["data_type"]

    vprintln("Downloading values for column $dataset_id:$column_name [$url]")
    
    response = HTTP.request("GET", url, headers)
    
    try
        body = String(response.body)
        str_values = split(body, '\n')
        values = Vector{String}(str_values[begin:end-1])
        if dtype == "float"
            return map((x -> parse(Float64, x)), values)
        elseif dtype == "int"
            return map((x -> parse(Int64, x)), values)
        else
            return map((x -> convert(String, x)), values)
        end
    catch e
        println("Error parsing values $dataset_id:$column_name [$url]")
        throw(e)
        return
    end

end

function get_column(dataset_id, url)
    vprintln("Downloading column $url")
    
    response = HTTP.request("GET", url, headers)
    column = Dict{String, Any}()
    
    try
        column = JSON.parse(String(response.body))
    catch
        println("Error parsing JSON for column $url")
        return
    end
    
    # Download column values
    values = get_column_values(dataset_id, column)
    pop!(column, "values", "")

    datasets[dataset_id][!, column["name_in_file"]] = values

    return column
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
    
    # Download columns
    columns = dataset_metadata[id]["columns"]
    len = length(columns)
    vprintln("Downloading $len columns for dataset $id")

    datasets[id] = DataFrame()
    column_metadata[id] = Dict{Int64, Any}()
    
    for (i, col) in enumerate(columns)
        timings = @timed column = get_column(id, col)
        column_metadata[id][i] = column
        n = column["name"]
        s = round(timings.time, digits = 2)
        vprintln("Column $n completed in $s seconds")
    end

    vprintln("Completed.")
end

for id in dataset_ids
    timings = @timed get_dataset(id)
    s = round(timings.time, digits = 2)
    vprintln("Completed dataset $id in $s seconds")
end

vprintln("All datasets complete.")
