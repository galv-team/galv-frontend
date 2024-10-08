import {
    createContext,
    ReactElement,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react'
import Snackbar, { SnackbarProps } from '@mui/material/Snackbar'
import { useImmer } from 'use-immer'
import Alert, { AlertProps } from '@mui/material/Alert'
import ListItem from '@mui/material/ListItem'
import List from '@mui/material/List'

export type SnackbarMessage = { message: ReactNode } & Pick<
    AlertProps,
    'severity'
>

export interface ISnackbarMessengerContext {
    snackbarMessages: (SnackbarMessage & { key: number })[]
    postSnackbarMessage: (message: SnackbarMessage) => void
    markRead: () => void
}

const SnackbarMessengerContext = createContext({} as ISnackbarMessengerContext)

export const useSnackbarMessenger = () => useContext(SnackbarMessengerContext)

export const SnackbarMessengerContextProvider = ({
    children,
}: {
    children: ReactElement
}) => {
    const [messages, setMessages] = useImmer<
        ISnackbarMessengerContext['snackbarMessages']
    >([])
    const postSnackbarMessage = (message: SnackbarMessage) =>
        setMessages((messages) => {
            messages.push({ key: new Date().getTime(), ...message })
        })
    const markRead = () =>
        setMessages((messages) => {
            messages.shift()
        })

    return (
        <SnackbarMessengerContext.Provider
            value={{
                postSnackbarMessage,
                snackbarMessages: messages,
                markRead,
            }}
        >
            {children}
        </SnackbarMessengerContext.Provider>
    )
}

export const SnackbarMessenger = (
    props: Omit<
        SnackbarProps,
        'message' | 'action' | 'key' | 'open' | 'onClose'
    >,
) => {
    const { snackbarMessages, markRead } = useSnackbarMessenger()
    const [open, setOpen] = useState<boolean>(snackbarMessages.length > 0)
    const handleClose = (_: unknown, reason?: string) => {
        if (reason === 'clickaway') return
        markRead()
    }
    useEffect(() => setOpen(snackbarMessages.length > 0), [snackbarMessages])

    const max_snacks = 4

    return (
        <List>
            {snackbarMessages.map(
                (m, i) =>
                    i < max_snacks && (
                        <ListItem key={m.key ?? `snackbar-messenger-${i}`}>
                            <Snackbar
                                open={open}
                                onClose={handleClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'left',
                                }}
                                autoHideDuration={5000}
                                {...props}
                            >
                                <Alert
                                    onClose={handleClose}
                                    severity={m.severity || 'info'}
                                >
                                    {m.message}
                                </Alert>
                            </Snackbar>
                        </ListItem>
                    ),
            )}
        </List>
    )
}
