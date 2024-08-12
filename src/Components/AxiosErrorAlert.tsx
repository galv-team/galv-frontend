import { AxiosError } from 'axios'
import Alert, { AlertProps } from '@mui/material/Alert'
import ListItem from '@mui/material/ListItem'
import List from '@mui/material/List'
import { AlertTitle } from '@mui/material'
import ListItemText from '@mui/material/ListItemText'

export type AxiosErrorAlertProps = {
    error?: AxiosError
    maxListLength?: number
    alertTitle?: ReturnType<typeof AlertTitle> | boolean
} & Omit<AlertProps, 'children'>

export default function AxiosErrorAlert({
    error,
    maxListLength,
    alertTitle,
    ...alertProps
}: AxiosErrorAlertProps) {
    const max_list_length = maxListLength ?? 3

    // Coerce undefined to a known AxiosError shape
    if (error === undefined) {
        return (
            <Alert severity="error" {...alertProps}>
                An unknown error occurred.
            </Alert>
        )
    }

    if (!error.response?.data) {
        return (
            <Alert severity="error" {...alertProps}>
                {error.message}
            </Alert>
        )
    }

    const error_object =
        error.response?.data instanceof Array
            ? Object.fromEntries(
                  error.response?.data.map((e: string, i: number) => [
                      `_${i}`,
                      e,
                  ]),
              )
            : error.response?.data

    const non_field_errors = error_object.non_field_errors ?? []

    const field_errors = Object.entries(error_object).filter(
        ([key]) => key !== 'non_field_errors',
    ) as [string, string][]

    const error_field_names = field_errors
        .slice(0, max_list_length)
        .map(([key]) => key)
    const hidden_error_count = field_errors.slice(max_list_length).length

    const total_error_count = non_field_errors.length + field_errors.length

    if (total_error_count === 1) {
        if (non_field_errors.length > 0)
            return (
                <Alert severity="error" {...alertProps}>
                    {alertTitle !== false &&
                        alertTitle !== undefined &&
                        alertTitle}
                    {non_field_errors[0]}
                </Alert>
            )
        const title =
            alertTitle === false
                ? null
                : (alertTitle ?? <AlertTitle>{field_errors[0][0]}</AlertTitle>)
        return (
            <Alert severity="error" {...alertProps}>
                {title}
                {field_errors[0][1]}
            </Alert>
        )
    }

    const title =
        alertTitle === false
            ? null
            : (alertTitle ?? (
                  <AlertTitle>{total_error_count} errors</AlertTitle>
              ))

    return (
        <Alert severity="error" {...alertProps}>
            {title}
            <List>
                {non_field_errors.map((error: string, i: number) => (
                    <ListItem disableGutters key={i}>
                        <ListItemText>{error}</ListItemText>
                    </ListItem>
                ))}
                {field_errors.length > 0 && (
                    <ListItem disableGutters>
                        <ListItemText>
                            There are errors with the values for{' '}
                            <em>{error_field_names.join(', ')}</em>
                            {hidden_error_count > 0 &&
                                `, and ${hidden_error_count} more`}
                            .
                        </ListItemText>
                    </ListItem>
                )}
            </List>
        </Alert>
    )
}
