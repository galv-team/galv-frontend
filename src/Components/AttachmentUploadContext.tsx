import { createContext, PropsWithChildren, useContext, useState } from 'react'
import {
    ArbitraryFile,
    ArbitraryFilesApi,
    ArbitraryFilesApiArbitraryFilesCreateRequest,
} from '@galv/galv'
import {
    useMutation,
    UseMutationResult,
    useQueryClient,
} from '@tanstack/react-query'
import { AxiosResponse } from 'axios'
import { useCurrentUser } from './CurrentUserContext'
import { LOOKUP_KEYS } from '../constants'

export interface IAttachmentUploadContext {
    file: File | null
    setFile: (file: File | null) => void
    getUploadMutation: (
        callback: (new_data_url?: string, error?: unknown) => void,
    ) => UseMutationResult<
        AxiosResponse<ArbitraryFile>,
        unknown,
        ArbitraryFilesApiArbitraryFilesCreateRequest
    >
}

const AttachmentUploadContext = createContext({} as IAttachmentUploadContext)

export const useAttachmentUpload = () => {
    const context = useContext(
        AttachmentUploadContext,
    ) as IAttachmentUploadContext
    if (context === undefined) {
        throw new Error(
            'useAttachmentUpload must be used within a AttachmentUploadContextProvider',
        )
    }
    return context
}

export default function AttachmentUploadContextProvider({
    children,
}: PropsWithChildren) {
    const [file, setFile] = useState<File | null>(null)

    const queryClient = useQueryClient()
    const { api_config } = useCurrentUser()
    const api_handler = new ArbitraryFilesApi(api_config)
    const UploadMutation: IAttachmentUploadContext['getUploadMutation'] = (
        callback,
    ) =>
        useMutation({
            mutationFn: (
                data: ArbitraryFilesApiArbitraryFilesCreateRequest,
            ) => {
                return api_handler.arbitraryFilesCreate.bind(api_handler)(data)
            },
            onSuccess: async (data: AxiosResponse<ArbitraryFile>) => {
                queryClient.setQueryData(
                    [LOOKUP_KEYS.ARBITRARY_FILE, data.data.id],
                    data.data,
                )
                await queryClient.invalidateQueries({
                    queryKey: [LOOKUP_KEYS.ARBITRARY_FILE, 'list'],
                })
                callback(data.data.url)
            },
            onError: (error: unknown) => {
                callback(undefined, error)
            },
        })

    return (
        <AttachmentUploadContext.Provider
            value={{ file, setFile, getUploadMutation: UploadMutation }}
        >
            {children}
        </AttachmentUploadContext.Provider>
    )
}
