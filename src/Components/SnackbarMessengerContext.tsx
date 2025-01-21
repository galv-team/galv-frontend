import { createContext, ReactElement, ReactNode, useContext } from 'react'
import Snackbar, { SnackbarProps } from '@mui/material/Snackbar'
import { useImmer } from 'use-immer'
import Alert, { AlertProps } from '@mui/material/Alert'
import ListItem from '@mui/material/ListItem'
import List from '@mui/material/List'

export type SnackbarMessage = { message: ReactNode } & Pick<
    AlertProps,
    'severity'
> & { unique_key?: string }

export interface ISnackbarMessengerContext {
    snackbarMessages: SnackbarMessage[]
    postSnackbarMessage: (message: SnackbarMessage) => void
    markRead: () => void
}

const SnackbarMessengerContext = createContext({} as ISnackbarMessengerContext)

export const useSnackbarMessenger = () => useContext(SnackbarMessengerContext)

export const SnackbarMessengerContextProvider = ({
    children,
}: {
    children: ReactElement<unknown>
}) => {
    const [messages, setMessages] = useImmer<
        ISnackbarMessengerContext['snackbarMessages']
    >([])
    const postSnackbarMessage = (message: SnackbarMessage) => {
        setMessages((messages) =>
            [...messages, message].reduce((acc, curr) => {
                if (!acc.find((m) => m.unique_key === curr.unique_key)) {
                    acc.push(curr)
                }
                return acc
            }, [] as SnackbarMessage[]),
        )
    }
    const markRead = () => {
        console.log('markRead', { messages })
        setMessages((messages) => messages.slice(1))
    }

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
    const handleClose = (_: unknown, reason?: string) => {
        if (reason === 'clickaway') return
        markRead()
    }

    const max_snacks = 4

    console.log({ snackbarMessages })

    return (
        <List>
            {snackbarMessages.map(
                (m, i) =>
                    i < max_snacks && (
                        <ListItem key={`snackbar-messenger-${i}`}>
                            <Snackbar
                                open={true}
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
