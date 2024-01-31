// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, {useCallback, useState} from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from "@mui/material/Box";
import {useCurrentUser} from "./Components/CurrentUserContext";
import UseStyles from "./styles/UseStyles";
import Popover from "@mui/material/Popover";
import {ICONS, LOOKUP_KEYS, PATHS} from "./constants";
import Grid from "@mui/material/Unstable_Grid2";
import {Link} from "react-router-dom";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import ButtonGroup from "@mui/material/ButtonGroup";
import {useSnackbarMessenger} from "./Components/SnackbarMessengerContext";
import {SerializableObject} from "./Components/TypeChanger";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import Stack from "@mui/material/Stack";
import {Configuration, User, UserRequest, UsersApi, ActivateApi} from "@battery-intelligence-lab/galv-backend";
import {AxiosError, AxiosResponse} from "axios";
import Alert, {AlertColor} from "@mui/material/Alert";

function RegisterForm({onSuccess}: {onSuccess?: (data: AxiosResponse<User>, password: string) => void}) {
    const {postSnackbarMessage} = useSnackbarMessenger()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const clear_form = () => {
        setUsername('')
        setFirstName('')
        setLastName('')
        setPassword('')
        setEmail('')
        setConfirmPassword('')
    }

    const queryClient = useQueryClient()
    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const users_handler = new UsersApi(config)
    const registration_mutation =
        useMutation(
            (data: UserRequest) => users_handler.usersCreate(data),
            {
                onSuccess: (data, variables, context) => {
                    if (data === undefined) {
                        console.warn("No data in mutation response", {data, variables, context})
                        return
                    }
                    queryClient.setQueryData([LOOKUP_KEYS.USER, data.data.id], data)
                    postSnackbarMessage({
                        message: `Activation code sent to ${data.data.email}`,
                        severity: 'success'
                    })
                    clear_form()
                    onSuccess && onSuccess(data, password)
                },
                onError: (error: AxiosError, variables, context) => {
                    console.error(error, {variables, context})
                    const d = error.response?.data as SerializableObject
                    const firstError = Object.entries(d)[0]
                    postSnackbarMessage({
                        message: <Stack>
                            <span>{`Error registering new user  
                        (HTTP ${error.response?.status} - ${error.response?.statusText}).`}</span>
                            <span style={{fontWeight: "bold"}}>{`${firstError[0]}: ${firstError[1]}`}</span>
                            {Object.keys(d).length > 1 && <span>+ {Object.keys(d).length - 1} more</span>}
                        </Stack>,
                        severity: 'error'
                    })
                },
            })

    const do_register = () => {
        if (username === "" || password === "" || email === "" || confirmPassword === "") return
        if (password !== confirmPassword) {
            postSnackbarMessage({
                message: `Password and password confirmation do not match`,
                severity: 'error'
            })
            return
        }
        registration_mutation.mutate({
            username,
            password,
            email,
            first_name: firstName,
            last_name: lastName,
        })
    }

    return <Box p={2}>
        <TextField
            autoFocus
            margin="dense"
            id="username"
            label="Username"
            type="text"
            fullWidth
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
            autoFocus
            margin="dense"
            id="firstname"
            label="First name"
            type="text"
            fullWidth
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
        />
        <TextField
            autoFocus
            margin="dense"
            id="lastname"
            label="Last name"
            type="text"
            fullWidth
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
        />
        <TextField
            margin="dense"
            id="email"
            label="Email"
            type="email"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <TextField
            margin="dense"
            id="confirm"
            label="Confirm Password"
            type="password"
            fullWidth
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button onClick={do_register} fullWidth={true}>Register</Button>
    </Box>
}

export function ActivationForm({_username, onSuccess}: {_username: string, onSuccess?: () => void}) {
    const [username, setUsername] = useState<string>(_username)
    const [code, setCode] = useState<string>("")
    const [result, setResult] = useState<string>(
        "Please check your email for an activation code from Galv."
    )
    const [status, setStatus] = useState<AlertColor | undefined>("success")

    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })

    return <Stack>
        <TextField
            autoFocus
            margin="dense"
            id="username"
            label="Username"
            type="text"
            fullWidth
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
        />
        <TextField
            autoFocus
            margin="dense"
            id="code"
            label="Activation code"
            type="text"
            fullWidth
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
        />
        <Stack direction="row" spacing={1}>
            <Button
                onClick={() =>
                    new ActivateApi(config).activateRetrieve({params: {username, token: code}})
                        .then((r) => {
                            setResult(r.data?.detail)
                            setStatus(r.status === 200? "success" : "error")
                            if (r.status === 200 && onSuccess)
                                return onSuccess()
                        })
                }>Activate my account</Button>
            <Button
                onClick={() =>
                    new ActivateApi(config).activateRetrieve({params: {username, resend: true}})
                        .then(r => {
                            setResult(r.data?.detail)
                            setStatus(r.status === 200? "success" : "error")
                        })
                }>Send a new code</Button>
        </Stack>
        <Alert severity={status}>{result}</Alert>
    </Stack>
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

export function Registration() {
    const {login, setLoginFormOpen} = useCurrentUser()
    const [tab, setTab] = useState<number>(0)
    const [username, setUsername] = useState<string>("")
    const [password, setPassword] = useState<string>("")

    function CustomTabPanel(props: TabPanelProps) {
        const { children, value, index, ...other } = props;

        return (
            <div
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
            >
                {value === index && (
                    <Box sx={{ p: 3 }}>
                        <Typography>{children}</Typography>
                    </Box>
                )}
            </div>
        );
    }

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    return (<Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={tab}
                onChange={(_e, v) => setTab(v)}
                aria-label="Registration steps"
            >
                <Tab label="Register" {...a11yProps(0)} />
                <Tab label="Activate" {...a11yProps(1)} />
            </Tabs>
        </Box>
        <CustomTabPanel value={tab} index={0}>
            <RegisterForm
                onSuccess={(data, password) => {
                    setUsername(data.data.username)
                    setPassword(password)
                    setTab(1)
                }} />
        </CustomTabPanel>
        <CustomTabPanel value={tab} index={1}>
            <ActivationForm _username={username} onSuccess={() => setTimeout(() => {
                login(username, password)
                setLoginFormOpen(false)
            }, 1000)} />
        </CustomTabPanel>
    </Box>)
}

export default function UserLogin() {
    const {user, login, logout, loginFormOpen, setLoginFormOpen} = useCurrentUser()
    const { classes } = UseStyles();

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [registerMode, setRegisterMode] = useState<boolean>(false)

    // useState + useCallback to avoid child popover rendering with a null anchorEl
    const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement|null>(null)
    const popoverAnchorRef = useCallback(
        (node: HTMLElement|null) => setPopoverAnchorEl(node),
        []
    )
    const do_login = () => {
        if (username === "" || password === "") return
        login(username, password)
        setLoginFormOpen(false)
        setUsername("")
        setPassword("")
    }

    const MainButton = user?
        <Button
            onClick={() => setLoginFormOpen(!loginFormOpen)}
            ref={popoverAnchorRef}
            startIcon={<ICONS.USER/>}
            variant="contained"
        >
            <Typography>{user.username}</Typography>
        </Button>
        : <ButtonGroup
            disableElevation
            variant="contained"
            aria-label="Disabled elevation buttons"
        >
            <Button
                onClick={() => {
                    setRegisterMode(false)
                    setLoginFormOpen(true)
                }}
                ref={popoverAnchorRef}
            >
                <Typography>Login</Typography>
            </Button>
            <Button
                onClick={() => {
                    setRegisterMode(true)
                    setLoginFormOpen(true)
                }}
                ref={popoverAnchorRef}
            >
                <Typography>Sign up</Typography>
            </Button>
        </ButtonGroup>

    const userForm = <List>
        <ListItem>
            <ListItemIcon>
                <ICONS.MANAGE_ACCOUNT />
            </ListItemIcon>
            <ListItemButton component={Link} to={`${PATHS.USER}/${user?.id}?editing=true`}>
                Manage Profile
            </ListItemButton>
        </ListItem>
        <ListItem>
            <ListItemIcon>
                <ICONS.TOKEN />
            </ListItemIcon>
            <ListItemButton component={Link} to={`${PATHS.TOKEN}`}>
                API Tokens
            </ListItemButton>
        </ListItem>
        <ListItem>
            <ListItemIcon>
                <ICONS.LOGOUT />
            </ListItemIcon>
            <ListItemButton onClick={() => {
                setUsername('')
                setPassword('')
                setLoginFormOpen(false)
                logout()
            }}>
                Logout
            </ListItemButton>
        </ListItem>
    </List>

    const loginForm = <Box p={2}><TextField
        autoFocus
        margin="dense"
        id="username"
        label="Username"
        type="text"
        fullWidth
        required
        value={username}
        onChange={(e) => setUsername(e.target.value)}
    />
        <TextField
            margin="dense"
            id="password"
            label="Password"
            type="password"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
        />
        <Button onClick={do_login} fullWidth={true}>Login</Button>
    </Box>

    const popoverContent = user? userForm : registerMode? <Registration/> : loginForm

    return <Grid className={classes.userLoginBox} container>
        {popoverAnchorEl && <Popover
            open={loginFormOpen}
            onClose={() => setLoginFormOpen(false)}
            anchorEl={popoverAnchorEl}
            anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
            transformOrigin={{vertical: 'top', horizontal: 'right'}}
            onKeyDown={(e) => {
                if (!user && e.key === "Enter") {
                    do_login()
                }
            }}
        >
            {popoverContent}
        </Popover>}
        {MainButton}
    </Grid>
}
