import { ResourceCreator } from '../../ResourceCreator'
import ErrorBoundary from '../../ErrorBoundary'
import ErrorCard from '../../error/ErrorCard'
import CardHeader from '@mui/material/CardHeader'
import Avatar from '@mui/material/Avatar'
import UndoRedoProvider from '../../UndoRedoContext'
import { Modal, ModalProps } from '@mui/material'
import React from 'react'
import { GalvResource, PATHS } from '../../../constants'
import { useApiResource } from '../../ApiResourceContext'
import { useNavigate } from 'react-router-dom'
import { get_url_components } from '../../misc'

export default function ForkModal<T extends GalvResource>(
    props: Omit<ModalProps, 'children'>,
) {
    const { apiResource, lookupKey, resourceId } = useApiResource<T>()
    const navigate = useNavigate()

    const [open, setOpen] = React.useState(props.open)

    return (
        <Modal {...props} open={open}>
            <div>
                <ErrorBoundary
                    fallback={(error: Error) => (
                        <ErrorCard
                            message={error.message}
                            header={
                                <CardHeader
                                    avatar={<Avatar variant="square">E</Avatar>}
                                    title="Error"
                                    subheader={`Error with ResourceCard for forking ${resourceId}`}
                                />
                            }
                        />
                    )}
                >
                    <UndoRedoProvider>
                        <ResourceCreator<T>
                            onCreate={(url, error) => {
                                if (error) {
                                    throw error
                                }
                                const components = get_url_components(
                                    url ?? 'NoURLReturned',
                                )
                                if (!components) {
                                    console.error(
                                        `Could not get URL components for ${url}`,
                                    )
                                    throw new Error(
                                        'Could not get URL for created resource',
                                    )
                                }
                                const { lookupKey, resourceId } = components
                                navigate(`/${PATHS[lookupKey]}/${resourceId}`)
                            }}
                            onDiscard={() => setOpen(false)}
                            lookupKey={lookupKey}
                            initial_data={{ ...apiResource, team: undefined }}
                        />
                    </UndoRedoProvider>
                </ErrorBoundary>
            </div>
        </Modal>
    )
}
