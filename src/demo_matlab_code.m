%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
% 
% galv REST API access
%   - Matt Jaquiery (Oxford RSE) <matt.jaquiery@dtc.ox.ac.uk>
%
% 2022-11-21
%
% Download datasets from the REST API.
% Downloads all data for all columns for the dataset and reads them
% into a struct object. Data are under data{x}.columns.data.
%
% SPDX-License-Identifier: BSD-2-Clause
% Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
% of Oxford, and the 'Galv' Developers. All rights reserved.
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% login to galv > Generate API Token
token = 'a8afab1fe7ec3df4542107201d10f93230f84e250b7b130780f09d387e8d40cd';
apiURL = 'http://api.localhost/datasets';
options = weboptions('HeaderFields', {'Authorization' ['Bearer ' token]});

% Datasets are referenced by id. 
% You can add in additional dataset_names or dataset_ids to also
% fetch the contents of those datasets.
dataset_ids = [2, 4]; % add additional dataset ids here if required

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
n = max(dataset_ids);
dataset_metadata = cell(n, 1);
column_metadata = cell(n, 1);
datasets = cell(n, 1);

dataset_ids = unique(dataset_ids);

for i = 1:length(dataset_ids)
    d = dataset_ids(i);
    
    % get data
    dsURL = strcat(apiURL, '/', num2str(d), '/');
    meta = webread(dsURL, options);
    dataset_metadata{d} = meta;
    
    column_metadata{i} = cell(length(meta.columns), 1);
    datasets{i} = table();
    
    % append column data in columns
    for c = 1:length(meta.columns)
        cURL = meta.columns{c};
        stream = webread(cURL, options);
        column_metadata{i}{c} = stream;
        column_content = webread(stream.values, options);
        % drop final newline
        column_content = regexprep(column_content, '\n$', '');
        column_content = strsplit(column_content, '\n');
        column_content = arrayfun(@(c) str2num(c{1}), column_content);
        datasets{i}.(matlab.lang.makeValidName(stream.name)) = rot90(column_content, -1);        
    end
end
