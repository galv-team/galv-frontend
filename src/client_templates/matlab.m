%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% 
% galv REST API access
%   - Matt Jaquiery (Oxford RSE) <matt.jaquiery@dtc.ox.ac.uk>
%
% 2024-02-13
%
% Download datasets from the REST API.
% Downloads all data for all columns for the dataset and reads them
% into struct objects: dataset_metadata, column_metadata, and datasets.
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
metadata = cell(n);
data = cell(n);

for i = 1:length(dataset_ids)
    d = dataset_ids(i);
    
    % get data
    dsURL = strcat(apiURL, '/files/', d, '/');
    metadata{i} = webread(dsURL, options);
    
    data{i} = table();
    
    % append column data in columns
    for c = 1:length(metadata{i}.columns)
        cURL = metadata{i}.columns{c};
        stream = webread(cURL, options);
        metadata{i}.columns{c} = stream;
        content = webread(stream.values, options);
        % handle conversion from bytes to utf-8
        content = native2unicode(content, "UTF-8");
        content = convertCharsToStrings(content);
        content = strip(content, "right", newline());
        content = split(content, newline());
        % type conversion where necessary
        if stream.data_type ~= "str"
            content = str2double(content);
        end
        data{i}.(matlab.lang.makeValidName(stream.name_in_file)) = content;        
    end
end
