import {UseQueryResult} from "@tanstack/react-query";
import {AxiosError, AxiosResponse} from "axios";
import {ReactNode} from "react";
import Typography from "@mui/material/Typography";

export type QueryDependentElement = (queries: UseQueryResult<AxiosResponse, AxiosError>[]) => ReactNode;

export type QueryWrapperProps = {
    queries: UseQueryResult<AxiosResponse, AxiosError>[];
    loading: ReactNode;
    error: QueryDependentElement | ReactNode;
    success: QueryDependentElement | ReactNode;
}

export default function QueryWrapper(props: QueryWrapperProps) {
    const loading = props.queries.some((query) => query.isLoading && query.isFetching)
    const error = props.queries.some((query) => query.isError)
    const success = props.queries.every((query) => query.isSuccess)

    if (error)
        return typeof props.error === 'function' ?
            props.error(props.queries.filter((query) => query.isError)) : props.error
    if (loading)
        return props.loading
    if (success)
        return typeof props.success === 'function' ?
            props.success(props.queries.filter((query) => query.isSuccess)) : props.success
    return <Typography sx={{width: "100%", textAlign: "center"}}>Unable to retrieve data.</Typography>
    // throw new Error('QueryWrapper: fall-through case reached')
}