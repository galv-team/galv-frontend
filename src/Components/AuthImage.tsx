/* Retrieve an image that requires API credentials to access and display it */
import React, { useEffect, useState } from 'react'
import { useCurrentUser } from './CurrentUserContext'
import { useQuery } from '@tanstack/react-query'
import { LOOKUP_KEYS } from '../constants'
import axios from 'axios'
import Skeleton from '@mui/material/Skeleton'

export default function AuthImage({
    file,
}: {
    file: { id: string; path: string; name?: string; png: string }
}) {
    const [imageData, setImageData] = useState('')
    const headers = {
        authorization: `Bearer ${useCurrentUser().user?.token}`,
    }
    const query = useQuery({
        queryKey: [LOOKUP_KEYS.FILE, file.id, 'png'],
        queryFn: async () => {
            return axios.get(file.png, { headers, responseType: 'blob' })
        },
    })

    useEffect(() => {
        if (query.data) {
            const imageURL = URL.createObjectURL(query.data.data)
            setImageData(imageURL)
        }
    }, [query.data])

    if (imageData) {
        return (
            <img
                src={imageData}
                alt={`Preview of data in ${file.name || file.path}`}
            />
        )
    }

    if (query.isLoading && query.isFetching) {
        return <Skeleton height={200} />
    }

    // This will always fail because the API requires authentication,
    // but it means that the user is aware that an image failed to load
    return (
        <img
            src={file.png}
            alt={`Preview of data in ${file.name || file.path}`}
        />
    )
}
