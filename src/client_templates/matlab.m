%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% 
% galv REST API access
%   - Matt Jaquiery (Oxford RSE) <matt.jaquiery@dtc.ox.ac.uk>
%
% 2024-02-13
%
% Download datasets from the REST API.
% Downloads all data for all columns for the dataset and reads them
% into struct objects: dataset_metadata, and parquets.
% Structs are indexed by dataset id.
%
% SPDX-License-Identifier: BSD-2-Clause
% Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
% of Oxford, and the 'Galv' Developers. All rights reserved.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% login to galv > Generate API Token
token = 'GALV_USER_TOKEN';
apiURL = 'GALV_API_HOST';
options = weboptions('HeaderFields', {'Authorization' ['Bearer ' token]; 'accept' 'application/json'});

% Datasets are referenced by id. 
% You can add in additional dataset_names or dataset_ids to also
% fetch the contents of those datasets.
% add additional dataset ids here if required
dataset_ids = [
    "GALV_DATASET_IDS"
];

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

dataset_ids = unique(dataset_ids);
n = length(dataset_ids);
metadata = cell(n, 1);
parquets = cell(n, 1);

for i = 1:length(dataset_ids)
    d = dataset_ids(i);
    
    % get data
    dsURL = strcat(apiURL, '/files/', d, '/');
    metadata{i} = webread(dsURL, options);
    
    tmp = tempname(tempdir());
    mkdir(tmp);
    
    % save parquet files to temporary locations
    for c = 1:length(metadata{i}.parquet_partitions)
        cURL = metadata{i}.parquet_partitions{c};
        partition = webread(cURL, options);
        metadata{i}.parquet_partitions{c} = partition;
        tmpf = [tempname(tmp), '.parquet'];
        websave(tmpf, partition.parquet_file, options);   
        % websave adds .html if it doesn't see an extension, so strip that
        movefile([tmpf, '.html'], tmpf);
    end

    % read the datasets as parquet files
    parquets{i} = parquetDatastore(tmp);
end

% Take a peek at one of the datasets
parquets{1}.preview()
