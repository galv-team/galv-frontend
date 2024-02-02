// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, {ReactNode} from "react";
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
import {DISPLAY_NAMES_PLURAL, LookupKey} from "../constants";
import ErrorBoundary from "./ErrorBoundary";
import Button from "@mui/material/Button";
import {useCurrentUser} from "./CurrentUserContext";
import {useFetchResource} from "./FetchResourceContext";
import IntroText from "./IntroText";

export function ResourceList<T extends BaseResource>({lookup_key}: {lookup_key: LookupKey}) {
    const { classes } = useStyles();
    const { useListQuery } = useFetchResource();

    const query = useListQuery<T>(lookup_key)

    const {setLoginFormOpen, user} = useCurrentUser()

    let content: ReactNode

    if (query.isInitialLoading) {
        content = Array(5).fill(0).map((_, i) => <Skeleton key={i} variant="rounded" height="6em"/>)
    } else if (query.results?.length === 0) {
        if (!user?.token)
            content = <p><Button onClick={() => setLoginFormOpen(true)}>Log in</Button> to see {DISPLAY_NAMES_PLURAL[lookup_key]}</p>
        else
            content = <p>No {DISPLAY_NAMES_PLURAL[lookup_key].toLowerCase()} on the server are visible for this account.</p>
    } else if (query.results) {
        content = query.results.map(
            (resource: T, i) => <ResourceCard
                key={`resource_${i}`}
                resource_id={resource.uuid as string ?? resource.id as number}
                lookup_key={lookup_key}
            />
        )
    } else {
        content = "No resources to show."
    }

    if (query?.hasNextPage && !query.isFetchingNextPage)
        query.fetchNextPage()

    return (
        <Container maxWidth="lg">
            <Grid container justifyContent="space-between" key="header">
                <Typography
                    component="h1"
                    variant="h3"
                    className={clsx(classes.pageTitle, classes.text)}
                >
                    {DISPLAY_NAMES_PLURAL[lookup_key]}
                    {query?.isLoading && <CircularProgress sx={{color: (t) => t.palette.text.disabled, marginLeft: "1em"}} />}
                </Typography>
            </Grid>
            <IntroText k={lookup_key} />
            <Stack spacing={2} key="body">
                {content}
                <ResourceCreator key={'creator'} lookup_key={lookup_key} />
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