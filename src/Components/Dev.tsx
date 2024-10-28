import React from 'react'
import { DownloadButton } from './download/DownloadButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

export function Dev() {
    if (!import.meta.env.DEV) {
        return <></>
    }
    return (
        <>
            <List>
                <ListItem>
                    <ListItemText>Data file only</ListItemText>
                    <DownloadButton
                        targetUUIDs={'72eb4cd4-65f2-4128-b822-694207cb5454'}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText>Data file data</ListItemText>
                    <DownloadButton
                        targetUUIDs={'72eb4cd4-65f2-4128-b822-694207cb5454'}
                        includeData={true}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText>2x Data files</ListItemText>
                    <DownloadButton
                        targetUUIDs={[
                            '72eb4cd4-65f2-4128-b822-694207cb5454',
                            'e7cd4895-1aa6-4b3f-9fae-365ecaa75bac',
                        ]}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText>2x Data files with data</ListItemText>
                    <DownloadButton
                        targetUUIDs={[
                            '72eb4cd4-65f2-4128-b822-694207cb5454',
                            'e7cd4895-1aa6-4b3f-9fae-365ecaa75bac',
                        ]}
                        includeData={true}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText>Experiment</ListItemText>
                    <DownloadButton
                        targetUUIDs={'ff7de7a5-ae98-4135-898e-71b4cc3170ae'}
                        iconButton={true}
                    />
                </ListItem>
                <ListItem>
                    <ListItemText>Experiment with data</ListItemText>
                    <DownloadButton
                        targetUUIDs={'ff7de7a5-ae98-4135-898e-71b4cc3170ae'}
                        includeData={true}
                        iconButton={true}
                    />
                </ListItem>
            </List>
        </>
    )
}
