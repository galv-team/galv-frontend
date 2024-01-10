// SPDX-License-Identifier: BSD-2-Clause
// Copyright  (c) 2020-2023, The Chancellor, Masters and Scholars of the University
// of Oxford, and the 'Galv' Developers. All rights reserved.

import React, {useState, useCallback} from "react";
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Box from "@mui/material/Box";
import {useCurrentUser} from "./Components/CurrentUserContext";
import UseStyles from "./styles/UseStyles";
import Popover from "@mui/material/Popover";
import {DISPLAY_NAMES, ICONS, PATHS} from "./constants";
import Grid from "@mui/material/Unstable_Grid2";
import {Link} from "react-router-dom";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItem from "@mui/material/ListItem";
import List from "@mui/material/List";
import ButtonGroup from "@mui/material/ButtonGroup";
import {useSnackbarMessenger} from "./Components/SnackbarMessengerContext";

export default function UserLogin() {
    const {postSnackbarMessage} = useSnackbarMessenger()
    const {user, login, logout, loginFormOpen, setLoginFormOpen} = useCurrentUser()
    const { classes } = UseStyles();

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [registerMode, setRegisterMode] = useState<boolean>(false)
    const [email, setEmail] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

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
    }
    const do_register = () => {
        if (username === "" || password === "" || email === "" || confirmPassword === "") return
        if (password !== confirmPassword) {
            postSnackbarMessage({
                message: `Password and password confirmation do not match`,
                severity: 'error'
            })
            return
        }
        
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
            <ListItemButton component={Link} to={`${PATHS.USER}/${user!.id}?editing=true`}>
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

    const usernameField = <TextField
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

    const passwordField =
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

    const registerForm = <Box p={2}>
        {usernameField}
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
        {passwordField}
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

    const loginForm = <Box p={2}>
        {usernameField}
        {passwordField}
        <Button onClick={do_login} fullWidth={true}>Login</Button>
    </Box>

    const popoverContent = user? userForm : registerMode? registerForm : loginForm

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
