import { createContext, ReactNode, useContext, useState } from 'react'
import { Configuration, KnoxUser, LoginApi, User } from '@galv/galv'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AxiosError, AxiosResponse } from 'axios'
import axios from 'axios'
import { useSnackbarMessenger } from './SnackbarMessengerContext'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { API_HANDLERS, LOOKUP_KEYS } from '../constants'

export type LoginUser = Pick<KnoxUser, 'token'> & User

export interface ICurrentUserContext {
    user: LoginUser | null
    api_config: Configuration
    login: (
        username: string,
        password: string,
        onSuccess?: (data: AxiosResponse<KnoxUser>) => void,
        onError?: (error: unknown) => void,
    ) => void
    last_login_error: AxiosError | undefined
    logout: () => void
    refresh_user: () => void
    loginFormOpen: boolean
    setLoginFormOpen: (open: boolean) => void
    settings: UserSettings
}

export type UserSettings = {
    api_request_alert_timeout: number
}

function get_user_settings(settings: Partial<UserSettings>): UserSettings {
    return {
        api_request_alert_timeout: 5000,
        ...settings
    }
}

class MockableLocalStorage {
    private _storage: Record<string, string> = {}
    private _mocked_keys: string[] = []

    constructor(initial_state: Record<string, string> = {}, extra_keys: string[] = []) {
        this._storage = initial_state
        this._mocked_keys = Object.keys(initial_state).concat(extra_keys)
    }

    getItem = (key: string) => this._mocked_keys.includes(key)? this._storage[key] : window.localStorage.getItem(key)
    setItem = (key: string, value: string) => this._mocked_keys.includes(key)? (this._storage[key] = value) : window.localStorage.setItem(key, value)
    removeItem = (key: string) => this._mocked_keys.includes(key)? delete this._storage[key] : window.localStorage.removeItem(key)
}

export const CurrentUserContext = createContext({} as ICurrentUserContext)

export const useCurrentUser = () => useContext(CurrentUserContext)

export default function CurrentUserContextProvider({
                                                       children,
                                                       user_override,
                                                   }: {
    children: ReactNode,
    // If set, this will overwrite localStorage methods
    user_override?: string|null
}) {
    const localStorage = user_override !== undefined
        ? new MockableLocalStorage(user_override ? { user: user_override } : {}, ['user'])
        : window.localStorage

    const local_user_string = localStorage.getItem('user')
    const local_user: LoginUser | null = JSON.parse(local_user_string || 'null')

    const [user, setUser] = useState<LoginUser | null>(local_user ?? null)
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [onSuccess, setOnSuccess] = useState<
        ((data: AxiosResponse<KnoxUser>) => void) | undefined
    >(undefined)
    const [lastError, setLastError] = useState<AxiosError | undefined>(
        undefined,
    )
    const [loginFormOpen, setLoginFormOpen] = useState<boolean>(false)

    const { postSnackbarMessage } = useSnackbarMessenger()

    const queryClient = useQueryClient()
    const get_config = () =>
        new Configuration({
            basePath: import.meta.env.VITE_GALV_API_BASE_URL,
            username,
            password,
        })
    const api_handler = new LoginApi(get_config())
    const Login = useMutation<AxiosResponse<KnoxUser>, AxiosError, void>({
        mutationFn: () => {
            setLastError(undefined)
            return api_handler.loginCreate.bind(new LoginApi(get_config()))()
        },
        onSuccess: (data) => {
            localStorage.setItem('user', JSON.stringify(data.data))
            setUser(data.data as unknown as LoginUser)
            queryClient.removeQueries({ predicate: () => true })
            onSuccess && onSuccess(data)
        },
        onError: setLastError,
    })

    const Logout = () => {
        if (user) {
            localStorage.removeItem('user')
            setUser(null)
            queryClient.removeQueries({ predicate: () => true })
        }
    }

    const do_login: ICurrentUserContext['login'] = (
        username: string,
        password: string,
        onSuccess?: (data: AxiosResponse<KnoxUser>) => void,
    ) => {
        setUsername(username)
        setPassword(password)
        setOnSuccess(onSuccess)
        setTimeout(() => Login.mutate(), 100)
    }

    const api_config = new Configuration({
        basePath: import.meta.env.VITE_GALV_API_BASE_URL,
        accessToken: user?.token,
    })

    const Refresh = useQuery({
        queryKey: [LOOKUP_KEYS.USER, 'refresh'],
        queryFn: () => {
            if (!user) return
            const api = new API_HANDLERS[LOOKUP_KEYS.USER](api_config)
            return api
                .usersRetrieve({ id: user.id })
                .then((response: AxiosResponse<User>) => {
                    const local_user: LoginUser | null = JSON.parse(
                        local_user_string || 'null',
                    )
                    setUser({ ...local_user, ...response.data } as LoginUser)
                    return response
                })
        },
        enabled: !!user,
    })

    axios.interceptors.response.use(
        undefined,
        // 401 should log the user out and display a message
        (error) => {
            if (error.response?.status === 401) {
                // Failed logins should show incorrect username/password message
                if (
                    error.response.data.detail === 'Invalid username/password.'
                ) {
                    postSnackbarMessage({
                        message: 'Incorrect username or password',
                        severity: 'error',
                    })
                } else if (user) {
                    Logout()
                    postSnackbarMessage({
                        message: (
                            <Stack direction="row" spacing={1}>
                                You have been logged out.
                                <Button onClick={() => setLoginFormOpen(true)}>
                                    Log in
                                </Button>
                            </Stack>
                        ),
                        severity: 'warning',
                    })
                }
            }
            return Promise.reject(error)
        },
    )

    return (
        <CurrentUserContext.Provider
            value={{
                user,
                login: do_login,
                last_login_error: lastError,
                logout: Logout,
                refresh_user: Refresh.refetch,
                loginFormOpen,
                setLoginFormOpen,
                api_config,
                settings: get_user_settings({}),
            }}
        >
            {children}
        </CurrentUserContext.Provider>
    )
}
