import {createContext, ReactNode, useContext, useState} from "react";
import {Configuration, KnoxUser, LoginApi, User}from "@galv/galv";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {AxiosError, AxiosResponse} from "axios";
import axios from "axios";
import {useSnackbarMessenger} from "./SnackbarMessengerContext";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export type LoginUser = Pick<KnoxUser, "token"> & User

export interface ICurrentUserContext {
    user: LoginUser|null
    api_config: Configuration
    login: (username: string, password: string) => void
    logout: () => void
    loginFormOpen: boolean
    setLoginFormOpen: (open: boolean) => void
}

export const CurrentUserContext = createContext({} as ICurrentUserContext)

export const useCurrentUser = () => useContext(CurrentUserContext)

export default function CurrentUserContextProvider({children}: {children: ReactNode}) {
    const local_user_string = window.localStorage.getItem('user')
    const local_user: LoginUser|null = JSON.parse(local_user_string || 'null')

    const [user, setUser] = useState<LoginUser|null>(local_user ?? null)
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')
    const [loginFormOpen, setLoginFormOpen] = useState<boolean>(false)

    const {postSnackbarMessage} = useSnackbarMessenger()

    const queryClient = useQueryClient()
    const get_config = () => new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        username,
        password
    })
    const api_handler = new LoginApi(get_config())
    const Login = useMutation<AxiosResponse<KnoxUser>, AxiosError, void>(
        () => api_handler.loginCreate.bind(new LoginApi(get_config()))(),
        {
            onSuccess: (data) => {
                window.localStorage.setItem('user', JSON.stringify(data.data))
                setUser(data.data as unknown as LoginUser)
                queryClient.removeQueries({predicate: () => true})
            }
        }
    )

    const Logout = () => {
        if (user) {
            window.localStorage.removeItem('user')
            setUser(null)
            queryClient.removeQueries({predicate: () => true})
        }
    }

    const do_login = (username: string, password: string) => {
        setUsername(username)
        setPassword(password)
        setTimeout(() => Login.mutate(), 100)
    }

    const api_config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: user?.token
    })

    axios.interceptors.response.use(
        undefined,
        // 401 should log the user out and display a message
        (error) => {
            if (error.response?.status === 401) {
                Logout()
                postSnackbarMessage({
                    message: <Stack direction="row" spacing={1}>
                        You have been logged out.
                        <Button onClick={() => setLoginFormOpen(true)}>Log in</Button>
                    </Stack>,
                    severity: 'warning'
                })
            }
            return Promise.reject(error)
        }
    )

    return <CurrentUserContext.Provider
        value={{user, login: do_login, logout: Logout, loginFormOpen, setLoginFormOpen, api_config}}
    >
        {children}
    </CurrentUserContext.Provider>
}
