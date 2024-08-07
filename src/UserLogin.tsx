// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, { useCallback, useState } from 'react'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useCurrentUser } from './Components/CurrentUserContext'
import UseStyles from './styles/UseStyles'
import Popover from '@mui/material/Popover'
import { ICONS, LOOKUP_KEYS, PATHS, SerializableObject } from './constants'
import Grid from '@mui/material/Unstable_Grid2'
import { Link } from 'react-router-dom'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItem from '@mui/material/ListItem'
import List from '@mui/material/List'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import ButtonGroup from '@mui/material/ButtonGroup'
import { useSnackbarMessenger } from './Components/SnackbarMessengerContext'
import {
    useMutation,
    UseMutationResult,
    useQueryClient,
} from '@tanstack/react-query'
import Stack from '@mui/material/Stack'
import {
    User,
    UserRequest,
    UsersApi,
    ActivateApi,
    ForgotPasswordApi,
    ResetPasswordApi,
    Configuration,
} from '@galv/galv'
import { AxiosError, AxiosResponse } from 'axios'
import Alert, { AlertColor } from '@mui/material/Alert'

function RegisterForm({
    onSuccess,
}: {
    onSuccess?: (data: AxiosResponse<User>, password: string) => void
}) {
    const { postSnackbarMessage } = useSnackbarMessenger()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [regErrors, setRegErrors] = useState<string[]>([])

    const clear_form = () => {
        setUsername('')
        setFirstName('')
        setLastName('')
        setPassword('')
        setEmail('')
        setConfirmPassword('')
        setRegErrors([])
    }

    const queryClient = useQueryClient()
    const { api_config } = useCurrentUser()
    const users_handler = new UsersApi(api_config)
    const registration_mutation: UseMutationResult<
        AxiosResponse<User>,
        AxiosError,
        UserRequest
    > = useMutation({
        mutationFn: (data) => users_handler.usersCreate({ userRequest: data }),
        onSuccess: (data, variables, context) => {
            if (data === undefined) {
                console.warn('No data in mutation response', {
                    data,
                    variables,
                    context,
                })
                return
            }
            queryClient.setQueryData([LOOKUP_KEYS.USER, data.data.id], data)
            postSnackbarMessage({
                message: `Activation code sent to ${data.data.email}`,
                severity: 'success',
            })
            clear_form()
            onSuccess && onSuccess(data, password)
        },
        onError: (error: AxiosError, variables, context) => {
            console.error(error, { variables, context })
            if (error.response?.data instanceof Object)
                setRegErrors(
                    Object.values(
                        error.response?.data as SerializableObject,
                    ).map((s) => String(s)),
                )
            else setRegErrors(['An error occurred'])
        },
    })

    const do_register = () => {
        if (
            username === '' ||
            password === '' ||
            email === '' ||
            confirmPassword === ''
        )
            return
        if (password !== confirmPassword) {
            setRegErrors(['Password and Confirm Password do not match'])
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

    return (
        <Box p={2}>
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
            <Button onClick={do_register} fullWidth={true}>
                Register
            </Button>
            <List>
                {regErrors.map((e, i) => (
                    <ListItem key={i}>
                        <Alert severity="error">{e}</Alert>
                    </ListItem>
                ))}
            </List>
        </Box>
    )
}

export function ActivationForm({
    _username,
    onSuccess,
}: {
    _username: string
    onSuccess?: () => void
}) {
    const [username, setUsername] = useState<string>(_username)
    const [code, setCode] = useState<string>('')
    const [result, setResult] = useState<string>(
        'Please check your email for an activation code from Galv.',
    )
    const [status, setStatus] = useState<AlertColor | undefined>('success')

    const { api_config } = useCurrentUser()

    return (
        <Stack>
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
                        new ActivateApi(api_config)
                            .activateRetrieve({
                                params: { username, token: code },
                            })
                            .then((r: AxiosResponse) => {
                                setResult(r.data?.detail)
                                setStatus(
                                    r.status === 200 ? 'success' : 'error',
                                )
                                if (r.status === 200 && onSuccess)
                                    return onSuccess()
                            })
                    }
                >
                    Activate my account
                </Button>
                <Button
                    onClick={() =>
                        new ActivateApi(api_config)
                            .activateRetrieve({
                                params: { username, resend: true },
                            })
                            .then((r: AxiosResponse) => {
                                setResult(r.data?.detail)
                                setStatus(
                                    r.status === 200 ? 'success' : 'error',
                                )
                            })
                    }
                >
                    Send a new code
                </Button>
            </Stack>
            <Alert severity={status}>{result}</Alert>
        </Stack>
    )
}

interface TabPanelProps {
    children?: React.ReactNode
    index: number
    value: number
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    )
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}

/*
 * Display the Registration and Activation forms in a tabbed interface
 * */
export function RegistrationForm() {
    const { login, setLoginFormOpen } = useCurrentUser()
    const [tab, setTab] = useState<number>(0)
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tab}
                    onChange={(_e, v) => setTab(v)}
                    title="Registration steps"
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
                    }}
                />
            </CustomTabPanel>
            <CustomTabPanel value={tab} index={1}>
                <ActivationForm
                    _username={username}
                    onSuccess={() =>
                        setTimeout(() => {
                            login(username, password)
                            setLoginFormOpen(false)
                        }, 1000)
                    }
                />
            </CustomTabPanel>
        </Box>
    )
}

/*
 * Display the Login and Reset Password forms in a tabbed interface
 * */
export function LoginForm() {
    const { user, login, last_login_error, setLoginFormOpen } = useCurrentUser()
    const [tab, setTab] = useState<number>(0)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [email, setEmail] = useState('')
    const [token, setToken] = useState('')
    const [resetStatus, setResetStatus] = useState<
        { severity: AlertColor; content: string } | undefined
    >(undefined)

    const do_login = () => {
        if (username === '' || password === '') return
        setResetStatus(undefined)
        login(username, password, (data) => {
            !!data && setLoginFormOpen(false)
        })
    }

    const config = new Configuration({
        basePath: import.meta.env.VITE_GALV_API_BASE_URL,
    })

    const request_reset = () => {
        if (email === '') {
            setResetStatus({
                severity: 'error',
                content: 'Please enter your email',
            })
            return
        }
        new ForgotPasswordApi(config)
            .forgotPasswordCreate({ passwordResetRequestRequest: { email } })
            .then(() => {
                setResetStatus({ severity: 'success', content: 'Token sent' })
            })
            .catch((e: AxiosError) => {
                setResetStatus({
                    severity: 'error',
                    content: e.response?.data?.error ?? 'An error occurred',
                })
            })
    }

    const reset_password = () => {
        if (email === '' || token === '' || password === '') {
            setResetStatus({
                severity: 'error',
                content: 'Please enter your email, token, and new password',
            })
            return
        }
        new ResetPasswordApi(config)
            .resetPasswordCreate({
                passwordResetRequest: { email, token, password },
            })
            .then(() => {
                setResetStatus({
                    severity: 'success',
                    content: 'Password reset',
                })
                setToken('')
                setPassword('')
                setEmail('')
                setTimeout(() => setTab(0), 500)
            })
            .catch((e: AxiosError) => {
                setResetStatus({
                    severity: 'error',
                    content: e.response?.data?.error ?? 'An error occurred',
                })
            })
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={tab}
                    onChange={(_e, v) => setTab(v)}
                    title="Login steps"
                >
                    <Tab label="Login" {...a11yProps(0)} />
                    <Tab label="Reset password" {...a11yProps(1)} />
                </Tabs>
            </Box>
            <CustomTabPanel value={tab} index={0}>
                <Box
                    p={2}
                    onKeyDown={(e) => {
                        if (!user && e.key === 'Enter') {
                            do_login()
                        }
                    }}
                >
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
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button onClick={do_login} fullWidth={true}>
                        Login
                    </Button>
                </Box>
            </CustomTabPanel>
            <CustomTabPanel value={tab} index={1}>
                <Box
                    p={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (token) {
                                reset_password()
                            } else {
                                request_reset()
                            }
                        }
                    }}
                >
                    <TextField
                        autoFocus
                        margin="dense"
                        id="email"
                        label="Email"
                        type="text"
                        fullWidth
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Stack direction="row" spacing={1}>
                        <TextField
                            margin="dense"
                            id="token"
                            label="Reset token"
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            fullWidth={true}
                            sx={{ width: '50%' }}
                        />
                        <Button
                            variant={!token ? 'contained' : 'outlined'}
                            onClick={request_reset}
                            disabled={!email}
                            fullWidth={true}
                        >
                            Get token
                        </Button>
                    </Stack>
                    <TextField
                        margin="dense"
                        id="password"
                        label="Password"
                        type="password"
                        fullWidth
                        required
                        value={password}
                        disabled={!email || !token}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        variant={
                            email && token && password
                                ? 'contained'
                                : 'outlined'
                        }
                        onClick={reset_password}
                        fullWidth={true}
                        disabled={!email || !token || !password}
                    >
                        Reset password
                    </Button>
                </Box>
            </CustomTabPanel>
            {last_login_error && (
                <Alert severity="error">
                    {last_login_error.response?.data?.detail ??
                        'An error occurred'}
                </Alert>
            )}
            {resetStatus && (
                <Alert severity={resetStatus.severity}>
                    {resetStatus.content}
                </Alert>
            )}
        </Box>
    )
}

export default function UserLogin() {
    const { user, logout, loginFormOpen, setLoginFormOpen } = useCurrentUser()
    const { classes } = UseStyles()

    const [registerMode, setRegisterMode] = useState<boolean>(false)

    // useState + useCallback to avoid child popover rendering with a null anchorEl
    const [popoverAnchorEl, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    )
    const popoverAnchorRef = useCallback(
        (node: HTMLElement | null) => setPopoverAnchorEl(node),
        [],
    )

    const MainButton = user ? (
        <Button
            onClick={() => setLoginFormOpen(!loginFormOpen)}
            ref={popoverAnchorRef}
            startIcon={<ICONS.USER />}
            variant="contained"
        >
            <Typography>{user.username}</Typography>
        </Button>
    ) : (
        <ButtonGroup
            disableElevation
            variant="contained"
            title="Disabled elevation buttons"
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
    )

    const userForm = (
        <List>
            <ListItem>
                <ListItemIcon>
                    <ICONS.MANAGE_ACCOUNT />
                </ListItemIcon>
                <ListItemButton
                    component={Link}
                    to={`${PATHS.USER}/${user?.id}?editing=true`}
                >
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
                <ListItemButton
                    onClick={() => {
                        setLoginFormOpen(false)
                        logout()
                    }}
                >
                    Logout
                </ListItemButton>
            </ListItem>
        </List>
    )

    const popoverContent = user ? (
        userForm
    ) : registerMode ? (
        <RegistrationForm />
    ) : (
        <LoginForm />
    )

    return (
        <Grid className={classes.userLoginBox} container>
            {popoverAnchorEl && (
                <Popover
                    open={loginFormOpen}
                    onClose={() => setLoginFormOpen(false)}
                    anchorEl={popoverAnchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    {popoverContent}
                </Popover>
            )}
            {MainButton}
        </Grid>
    )
}
