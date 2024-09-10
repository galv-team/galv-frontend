// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import { makeStyles } from 'tss-react/mui'
import { alpha, Theme } from '@mui/material/styles'

const item = (theme: Theme) => ({
    ' .MuiCardHeader-root': {
        paddingBottom: 0,
        ' .MuiAvatar-root': {
            borderRadius: theme.spacing(0.5),
        },
        ' .MuiLink-root': {
            color: 'inherit',
            textDecoration: 'none',
            '&:hover': {
                textDecoration: 'underline',
            },
        },
        ' .MuiCardHeader-title': {
            fontSize: 'large',
        },
    },
    ' .MuiCardContent-root': {
        paddingTop: theme.spacing(0.5),
    },
})
export default makeStyles()((theme) => {
    const drawerWidth = theme.spacing(30)
    const appBarHeight = theme.spacing(8)

    return {
        userLoginBox: {
            '& .MuiButton-root': {
                backgroundColor: theme.palette.primary.main,
                boxShadow: 'none',
                border: 'none',
            },
        },
        loginPaper: {
            marginTop: theme.spacing(8),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        },
        mainPaper: {
            padding: theme.spacing(1),
        },
        icon: {
            margin: theme.spacing(1),
            width: theme.spacing(7),
            height: theme.spacing(10),
        },
        form: {
            width: '100%', // Fix IE 11 issue.
            marginTop: theme.spacing(1),
        },
        statusAlert: {
            '& .MuiAlert-message': { width: '100%' },
        },
        submit: {
            margin: theme.spacing(3, 0, 2),
        },
        textActive: {
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.common.white,
            textAlign: 'center',
            cursor: 'pointer',
        },
        textInactive: {
            textAlign: 'center',
            cursor: 'pointer',
        },
        root: {
            display: 'flex',
            '& svg': { fontSize: '1.8em' },
        },
        toolbar: {
            paddingRight: 24, // keep right padding when drawer closed
        },
        toolbarIcon: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '0 8px',
            // ...theme.mixins.toolbar,
        },
        appBar: {
            zIndex: theme.zIndex.drawer + 1,
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            height: appBarHeight,
        },
        appBarShift: {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: theme.transitions.create(['width', 'margin'], {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        galvLogo: {
            '& div': {
                display: 'flex',
                '& svg': {
                    height: `calc(${appBarHeight} - ${theme.spacing(2)})`,
                    width: 'auto',
                },
            },
        },
        menuButton: {
            marginRight: 36,
        },
        menuButtonHidden: {
            display: 'none',
        },
        title: {
            marginLeft: 16,
            flexGrow: 1,
        },
        drawerPaper: {
            position: 'relative',
            paddingTop: 20,
            whiteSpace: 'nowrap',
            width: drawerWidth,
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
            }),
        },
        drawerPaperClose: {
            overflowX: 'hidden',
            transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.leavingScreen,
            }),
            width: theme.spacing(7),
            [theme.breakpoints.up('sm')]: {
                width: theme.spacing(9),
            },
        },
        content: {
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
            paddingTop: theme.spacing(9),
            paddingLeft: theme.spacing(0),
            paddingRight: theme.spacing(0),
            paddingBottom: theme.spacing(0),
            fontFamily: 'Helvetica Neue,Helvetica,Arial,sans-serif',
        },
        deleteIcon: {
            '&:hover': { color: theme.palette.error.light },
            '&:focus': { color: theme.palette.error.light },
        },
        dangerIcon: {
            cursor: 'pointer',
            color: theme.palette.error.main,
        },
        paper: { marginBottom: theme.spacing(2) },
        text: {},
        pageTitle: {
            marginBottom: theme.spacing(2),
            color: theme.palette.text.secondary,
        },
        chart: {
            height: 300,
        },
        filterBar: {
            justifyContent: 'space-between',
            maxHeight: theme.spacing(30),
            overflowY: 'auto',
            '& .horizontal': {
                alignItems: 'center',
            },
        },
        filterCreate: {
            '& .MuiInputBase-root': {
                height: '3em',
            },
        },
        itemChip: {
            width: 'min-content',
            justifyContent: 'flex-start',
            minWidth: theme.spacing(5),
            margin: theme.spacing(0.5),
            borderRadius: theme.spacing(0.5),
            borderColor: 'transparent',
            '&:not(.filter_failed):hover': {
                borderColor: theme.palette.primary.light,
                ' .MuiSvgIcon-root': {
                    color: theme.palette.primary.light,
                },
            },
            ' .MuiSvgIcon-root': {
                width: '1em',
                height: '1em',
            },
            '&.filter_failed': {
                color: theme.palette.text.disabled,
            },
        },
        itemCard: {
            ...item(theme),
        },
        itemCreateCard: {
            height: `calc(100vh - ${theme.spacing(8)})`,
        },
        itemPage: {
            ...item(theme),
        },
        error: { color: theme.palette.error.main },
        countBadge: {
            ' .MuiBadge-badge': {
                backgroundColor: theme.palette.grey.A100,
                color: theme.palette.grey.A700,
            },
        },
        prettyTable: {
            backgroundColor: theme.palette.background.paper,
            '& td, & th': {
                border: 'none',
                verticalAlign: 'top',
            },
            '& tr:not(:first-of-type)': {
                '& > td, & > th': {
                    paddingTop: 0,
                },
            },
            '& th': {
                textAlign: 'right',
                paddingRight: 0,
                paddingLeft: theme.spacing(1),
                color: theme.palette.text.disabled,
                '& .MuiTypography-root': {
                    fontWeight: 'bold',
                },
                '& *': {
                    textAlign: 'right',
                },
            },
            '&:not(.edit_mode) td': {
                width: '100%',
            },
        },
        prettyArray: {
            backgroundColor: theme.palette.background.paper,
            '& .MuiListItem-root': {
                paddingLeft: theme.spacing(0.5),
                '& .MuiListItemIcon-root': {
                    minWidth: theme.spacing(1),
                    marginRight: theme.spacing(0.5),
                    marginTop: 0,
                },
            },
        },
        prettyNested: {
            backgroundColor: theme.palette.grey.A100,
        },
        prettySelect: {
            width: 300,
        },
        selectedResources: {},
        selectedResourcesList: {},
        tool: {
            width: '100%',
            border: 'none',
            boxShadow: 'none',
            borderRadius: 0,
        },
        typeChangerButton: {},
        typeChangerPopover: {
            zIndex: 5000,
        },
        typeChangerResourcePopover: {},
        mappingTable: {
            paddingTop: theme.spacing(2),
            '& td > svg': { verticalAlign: 'middle' },
        },
        mappingWarnings: {},
        mappingSectionHeader: {
            fontWeight: 'bold',
            fontSize: 'large',
            '& .MuiTypography-root': {
                display: 'inline-block',
            },
        },
        mappingSectionHeaderClickable: {
            cursor: 'pointer',
        },
        mappingHeaderComment: {
            marginLeft: theme.spacing(2),
            fontSize: 'small',
            fontWeight: 'normal',
            display: 'inline-flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        mappingRowCountSelector: {
            '& .MuiButtonBase-root': {
                padding: 0,
                marginLeft: theme.spacing(0.5),
                marginRight: theme.spacing(0.5),
            },
        },
        mappingHeaderSlider: {
            marginLeft: theme.spacing(2),
            maxWidth: '10em',
        },
        mappingTableHeadRow: {
            '& th, & td': {
                fontWeight: 'bold',
            },
        },
        mappingResetColumn: {
            color: theme.palette.warning.light,
        },
        mappingRequiredColumn: {
            color: theme.palette.success.main,
        },
        mappingDefaultColumn: {
            '& span': { fontWeight: 'bold' },
        },
        mappingRebase: {
            minWidth: '9em',
            fontFamily: 'math',
            '& input, & div': { fontFamily: 'math' },
        },
        mappingRebaseEdit: {
            minWidth: '18em',
        },
        mappingNumberInput: {
            '& input': {
                padding: 0,
                paddingTop: 0,
                paddingBottom: 0,
                paddingLeft: 0,
                paddingRight: 0,
            },
        },
        mappingInitial: {
            backgroundColor: alpha(theme.palette.info.main, 0.1),
        },
        mappingProcess: {
            backgroundColor: alpha(theme.palette.warning.main, 0.1),
        },
        mappingResult: {
            backgroundColor: alpha(theme.palette.success.main, 0.1),
        },
        statusActions: {
            '& .MuiList-root': {
                width: '100%',
            },
            '& .MuiButton-root': {
                paddingTop: 0,
                paddingBottom: 0,
            },
        },
        filePreview: {
            width: '80%',
            minWidth: '500px',
            placeSelf: 'center',
        },
        paginationBar: {
            width: '100%',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
        },
        inlineProgress: {
            marginLeft: theme.spacing(1),
            marginRight: theme.spacing(1),
            color: theme.palette.text.disabled,
        },
        resourceSummary: {
            '& > .MuiStack-root': {
                display: 'flex',
                lineHeight: '2em',
                alignItems: 'center',
                '& .MuiChip-root': {
                    minWidth: '10em',
                },
            },
        },
        chipList: {
            overflowX: 'auto',
            overflowY: 'hidden',
            display: 'flex',
            lineHeight: '2em',
            alignItems: 'center',
            '& .MuiChip-root': {
                minWidth: '10em',
            },
        },
        fieldError: {
            outline: `1px solid ${theme.palette.error.main}`,
        },
        fieldErrorDetail: {},
        fileUpload: {
            display: 'flex',
            justifyContent: 'stretch',
            alignItems: 'center',
            '& section': {
                margin: '1em',
                border: '2px dashed',
                borderRadius: '1em',
                width: '100%',
                padding: '1em',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'stretch',
                alignItems: 'stretch',
                '&:hover': {
                    backgroundColor: theme.palette.grey[100],
                },
                '& div': {
                    width: '100%',
                    height: '100%',
                },
            },
        },
    }
})
