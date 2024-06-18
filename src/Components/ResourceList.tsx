// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, {ReactNode, useContext} from "react";
import useStyles from "../styles/UseStyles";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import clsx from "clsx";
import Grid from "@mui/material/Unstable_Grid2";
import CircularProgress from "@mui/material/CircularProgress";
import Skeleton from "@mui/material/Skeleton";
import ResourceCard, {BaseResource} from "./ResourceCard";
import ResourceCreator from "./ResourceCreator";
import {
    DEFAULT_FETCH_LIMIT,
    DISPLAY_NAMES_PLURAL,
    FAMILY_LOOKUP_KEYS,
    get_has_family,
    LOOKUP_KEYS,
    LookupKey
} from "../constants";
import ErrorBoundary from "./ErrorBoundary";
import Button from "@mui/material/Button";
import {useCurrentUser} from "./CurrentUserContext";
import {useFetchResource} from "./FetchResourceContext";
import IntroText from "./IntroText";
import ClientCodeDemo from "../ClientCodeDemo";
import TablePagination from "@mui/material/TablePagination";
import {FilterContext} from "./filtering/FilterContext";

export type ResourceListProps = {
    lookup_key: LookupKey
}

export function ResourceList<T extends BaseResource>({lookup_key}: ResourceListProps) {
    const { classes } = useStyles();
    const { useListQuery } = useFetchResource();

    const {setLoginFormOpen, user} = useCurrentUser()

    const {passesFilters} = useContext(FilterContext)

    const [page, setPage] = React.useState(0)
    const [itemsPerPage, setItemsPerPage] = React.useState(DEFAULT_FETCH_LIMIT)

    const query = useListQuery<T>(lookup_key, itemsPerPage)

    if (query?.hasNextPage && !query.isFetchingNextPage)
        query.fetchNextPage()

    let results = query.results ?? []

    let content: ReactNode

    if (query.isInitialLoading) {
        content = Array(itemsPerPage).fill(0).map((_, i) => <Skeleton key={i} variant="rounded" height="6em"/>)
    } else if (query.results?.length === 0) {
        if (!user?.token)
            content = <p><Button onClick={() => setLoginFormOpen(true)}>Log in</Button> to see {DISPLAY_NAMES_PLURAL[lookup_key]}</p>
        else
            content = <p>No {DISPLAY_NAMES_PLURAL[lookup_key].toLowerCase()} on the server are visible for this account.</p>
    } else if (query.results) {
        // Reduce the result count for pagination to only those that pass filters
        results = query.results
            .filter(r => passesFilters({apiResource: r}, lookup_key))  // todo: family filters
        content = results
            .filter((r, i) => i >= (page * itemsPerPage) && i < ((page + 1) * itemsPerPage))
            .map(
            (resource: T, i) => <ResourceCard
                key={`resource_${i}`}
                resource_id={resource.id as string ?? resource.id as number}
                lookup_key={lookup_key}
            />
        )
    } else {
        content = "No resources to show."
    }

    return (
        <Container maxWidth="lg">
            <Grid container justifyContent="space-between" key="header">
                <Typography
                    component="h1"
                    variant="h3"
                    className={clsx(classes.pageTitle, classes.text)}
                >
                    {DISPLAY_NAMES_PLURAL[lookup_key]}
                    {query.isLoading &&
                        query.isFetching &&
                        <CircularProgress className={clsx(classes.inlineProgress)} size={20} />}
                </Typography>
            </Grid>
            <IntroText k={lookup_key} />
            <Stack spacing={2} key="body">
                {lookup_key === LOOKUP_KEYS.FILE && <ClientCodeDemo fileQueryLimit={itemsPerPage} />}
                {content}
                <ResourceCreator key={'creator'} lookup_key={lookup_key} />
                {get_has_family(lookup_key) && <ResourceCreator key={'family_creator'} lookup_key={FAMILY_LOOKUP_KEYS[lookup_key]} />}
            </Stack>
            <Stack
                direction="row"
                spacing={1}
                className={clsx(classes.paginationBar)}
                sx={{paddingTop: (t) => t.spacing(1)}}
            >
                {query.isFetching &&
                    <CircularProgress className={clsx(classes.inlineProgress)} size={20} />}
                <TablePagination
                    component="div"
                    count={results.length ?? 0}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPageOptions={[1, 3, 5, 10, 25, 50, { value: -1, label: 'All' }]}
                    rowsPerPage={itemsPerPage}
                    onRowsPerPageChange={(e) => setItemsPerPage(parseInt(e.target.value, 10))}
                    // todo: Custom pagination actions? https://mui.com/material-ui/react-table/#custom-pagination-actions
                />
            </Stack>
        </Container>
    );
}

export default function WrappedResourceList(props: {lookup_key: LookupKey}) {
    return <ErrorBoundary
        fallback={<p>{props.lookup_key}: Could not load {DISPLAY_NAMES_PLURAL[props.lookup_key]}</p>}
        key={props.lookup_key}
    >
        <ResourceList {...props} />
    </ErrorBoundary>
}