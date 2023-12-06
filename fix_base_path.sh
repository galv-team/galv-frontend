#!/usr/bin/env sh

# This script fixes the base path in the generated API client base.ts file
# The correct base path is determined by the environment variable GALV_API_BASE_URL

# Check if the GALV_API_BASE_URL environment variable is set
if [ -z "$GALV_API_BASE_URL" ]
then
    echo "GALV_API_BASE_URL environment variable is not set"
    exit 1
fi

# Check if the generated base.ts file exists
if [ ! -f "src/api_codegen/base.ts" ]
then
    echo "src/api_codegen/base.ts file does not exist"
    exit 1
fi

# Check BASE_PATH variable in base.ts file
if grep -q "BASE_PATH = " "src/api_codegen/base.ts"
then
    echo "Hacking BASE_PATH in base.ts file to be $GALV_API_BASE_URL"
    sed -i "/.*BASE_PATH = .*/c\export const BASE_PATH = \"$GALV_API_BASE_URL\".replace(/\\\/+\$/, \"\");" src/api_codegen/base.ts
    echo "BASE_PATH variable in base.ts file is set to $GALV_API_BASE_URL"
else
    echo "Could not find BASE_PATH variable in base.ts file"
    exit 1
fi
