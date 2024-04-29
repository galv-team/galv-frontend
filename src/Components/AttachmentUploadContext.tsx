import {createContext, PropsWithChildren, useContext, useState} from "react";
import {ArbitraryFile, ArbitraryFilesApi, Configuration} from "@battery-intelligence-lab/galv";
import {useMutation, UseMutationResult, useQueryClient} from "@tanstack/react-query";
import {AxiosResponse} from "axios";
import {useCurrentUser} from "./CurrentUserContext";
import {LOOKUP_KEYS} from "../constants";

type ArbitraryFileUpload = Pick<ArbitraryFile, "name"|"team"|"is_public"|"description">

export interface IAttachmentUploadContext {
    file: File|null
    setFile: (file: File|null) => void
    UploadMutation: UseMutationResult<AxiosResponse<ArbitraryFile>, unknown, ArbitraryFileUpload>
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
    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const api_handler = new ArbitraryFilesApi(config)
    const UploadMutation = useMutation(
        ({name, team, is_public, description}: ArbitraryFileUpload) => {
            description = description ?? undefined
            if (!file)
                throw new Error("No file to upload")
            if (!team)
                throw new Error("Files must belong to a Team")
            return api_handler.arbitraryFilesCreate.bind(api_handler)(name, file, team, description, is_public)
        },
        {
            onSuccess: (data: AxiosResponse<ArbitraryFile>) => {
                queryClient.setQueryData([LOOKUP_KEYS.ARBITRARY_FILE, data.data.id], data.data)
                queryClient.invalidateQueries([LOOKUP_KEYS.ARBITRARY_FILE, "list"])
            }
        }
    )

    return <AttachmentUploadContext.Provider value={{file, setFile, UploadMutation}}>
        {children}
    </AttachmentUploadContext.Provider>
}