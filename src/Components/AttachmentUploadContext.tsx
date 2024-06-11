import {createContext, PropsWithChildren, useContext, useState} from "react";
import {ArbitraryFile, ArbitraryFilesApi} from "@galv/galv";
import {useMutation, UseMutationResult, useQueryClient} from "@tanstack/react-query";
import {AxiosResponse} from "axios";
import {useCurrentUser} from "./CurrentUserContext";
import {LOOKUP_KEYS} from "../constants";

type ArbitraryFileUpload = Pick<ArbitraryFile, "name"|"team"|"description">

export interface IAttachmentUploadContext {
    file: File|null
    setFile: (file: File|null) => void
    getUploadMutation: (callback: (new_data_url?: string, error?: unknown) => void) =>
        UseMutationResult<AxiosResponse<ArbitraryFile>, unknown, ArbitraryFileUpload>
}

const AttachmentUploadContext = createContext({} as IAttachmentUploadContext)

export const useAttachmentUpload = () => {
    const context = useContext(AttachmentUploadContext) as IAttachmentUploadContext
    if (context === undefined) {
        throw new Error('useAttachmentUpload must be used within a AttachmentUploadContextProvider')
    }
    return context
}

export default function AttachmentUploadContextProvider({children}: PropsWithChildren) {

    const [file, setFile] = useState<File|null>(null)

    const queryClient = useQueryClient()
    const {api_config} = useCurrentUser()
    const api_handler = new ArbitraryFilesApi(api_config)
    const UploadMutation: IAttachmentUploadContext["getUploadMutation"] = callback => useMutation(
        ({name, team, description}: ArbitraryFileUpload) => {
            description = description ?? undefined
            if (!file)
                throw new Error("No file to upload")
            if (!team)
                throw new Error("Files must belong to a Team")
            return api_handler.arbitraryFilesCreate.bind(api_handler)(name, file, team, description)
        },
        {
            onSuccess: async (data: AxiosResponse<ArbitraryFile>) => {
                queryClient.setQueryData([LOOKUP_KEYS.ARBITRARY_FILE, data.data.id], data.data)
                await queryClient.invalidateQueries([LOOKUP_KEYS.ARBITRARY_FILE, "list"])
                callback(data.data.url)
            },
            onError: (error: unknown) => {
                callback(undefined, error)
            }
        }
    )

    return <AttachmentUploadContext.Provider value={{file, setFile, getUploadMutation: UploadMutation}}>
        {children}
    </AttachmentUploadContext.Provider>
}