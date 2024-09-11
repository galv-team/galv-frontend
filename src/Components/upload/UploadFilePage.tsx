import Stack from '@mui/material/Stack'
import Dropzone from 'react-dropzone'
import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { CreateMutationVariablesType } from '../FetchResourceContext'
import { LOOKUP_KEYS, PATHS, SerializableObject } from '../../constants'
import useStyles from '../../styles/UseStyles'
import {
    FilesApi,
    FilesApiFilesCreateRequest,
    ObservedFile,
    ObservedFileCreate,
} from '@galv/galv'
import Button from '@mui/material/Button'
import { useCurrentUser } from '../CurrentUserContext'
import UndoRedoProvider, { useUndoRedoContext } from '../UndoRedoContext'
import {
    from_type_value_notation,
    to_type_value_notation_wrapper,
} from '../TypeValueNotation'
import CardActionBar from '../CardActionBar'
import Collapse from '@mui/material/Collapse'
import PrettyObject from '../prettify/PrettyObject'
import AxiosErrorAlert from '../AxiosErrorAlert'
import { AxiosError, AxiosResponse } from 'axios'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useApiResource } from '../ApiResourceContext'
import Typography from '@mui/material/Typography'
import ButtonGroup from '@mui/material/ButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import { MdCloudUpload } from 'react-icons/md'
import { styled } from '@mui/system'
import Alert from '@mui/material/Alert'

const CustomDropzone = ({ setFile }: { setFile: (file: File) => void }) => {
    return (
        <Dropzone
            onDrop={(acceptedFiles) => setFile(acceptedFiles[0])}
            multiple={false}
        >
            {({
                getRootProps,
                getInputProps,
                isDragActive,
                acceptedFiles,
                fileRejections,
            }) => (
                <section>
                    <div
                        aria-label="Select file"
                        {...getRootProps()}
                        role="button"
                    >
                        <input {...getInputProps()} />
                        {isDragActive ? (
                            <p>Drop your data file here ...</p>
                        ) : (
                            <p>
                                Drop your data file here, or click to select the
                                file using the system menu.
                            </p>
                        )}
                        <aside>
                            {acceptedFiles.map((file) => (
                                <li key={file.name}>
                                    {file.name} - {file.size} bytes
                                </li>
                            ))}
                            {fileRejections.map(({ file, errors }) => (
                                <li key={file.name}>
                                    {file.name} - {file.size} bytes
                                    <ul>
                                        {errors.map((e) => (
                                            <li key={e.code}>{e.message}</li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </aside>
                    </div>
                </section>
            )}
        </Dropzone>
    )
}

//https://mui.com/material-ui/react-button/#file-upload
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
})

export type ReuploadFileProps = {
    // Show an inline split button for selecting a file and uploading it
    clickOnly?: boolean
}

export function ReuploadFile({ clickOnly }: ReuploadFileProps) {
    const { apiResource } = useApiResource<ObservedFile>()

    const [complete, setComplete] = useState(false)
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const { classes } = useStyles()
    const [alertContent, setAlertContent] = useState<ReactNode | null>(null)

    const { user, api_config } = useCurrentUser()
    const navigate = useNavigate()
    const api = new FilesApi(api_config)
    const create_mutation = useMutation<
        AxiosResponse<ObservedFileCreate>,
        AxiosError,
        FilesApiFilesCreateRequest
    >({
        mutationFn: (data: FilesApiFilesCreateRequest) =>
            api.filesCreate.bind(api)(data),
        onSuccess: (data: AxiosResponse<ObservedFileCreate>) => {
            if (data) {
                navigate(`${PATHS[LOOKUP_KEYS.FILE]}/${data.data.id}`)
            }
        },
        onError: (error: AxiosError) => {
            setAlertContent(<AxiosErrorAlert error={error} />)
        },
    })
    const create_no_nav = useMutation<
        AxiosResponse<ObservedFileCreate>,
        AxiosError,
        FilesApiFilesCreateRequest
    >({
        mutationFn: (data: FilesApiFilesCreateRequest) =>
            api.filesCreate.bind(api)(data),
        onSuccess: () => {
            setComplete(true)
        },
        onError: (error: AxiosError) => {
            setAlertContent(<AxiosErrorAlert error={error} />)
        },
    })

    if (clickOnly) {
        return complete ? (
            <Alert severity="success">
                <em>Uploaded</em>
            </Alert>
        ) : (
            <Stack direction={'row'} spacing={1}>
                <ButtonGroup variant="contained">
                    <Button
                        disabled={!create_no_nav.isIdle}
                        component="label"
                        variant="text"
                        color={alertContent ? 'error' : 'primary'}
                        role={undefined}
                        aria-label="Select data file"
                        tabIndex={-1}
                    >
                        <VisuallyHiddenInput
                            type="file"
                            onChange={(e) => {
                                setAlertContent(null)
                                console.log(e.target.files)
                                if (!e.target.files) setUploadedFile(null)
                                else setUploadedFile(e.target.files![0])
                            }}
                        />
                        {uploadedFile ? (
                            <Tooltip title={'click to replace'}>
                                <kbd>{uploadedFile.name}</kbd>
                            </Tooltip>
                        ) : (
                            'Select data file'
                        )}
                    </Button>
                    <Button
                        size="small"
                        aria-label="Upload"
                        disabled={
                            !create_no_nav.isIdle ||
                            !uploadedFile ||
                            !apiResource
                        }
                        onClick={() => {
                            return create_no_nav.mutate({
                                file: uploadedFile!,
                                targetFileId: String(apiResource!.id),
                                uploader: String(user?.id),
                                path: apiResource!.path,
                                team: apiResource!.team,
                            })
                        }}
                    >
                        <MdCloudUpload />
                    </Button>
                </ButtonGroup>
                <Collapse in={alertContent !== null}>{alertContent}</Collapse>
            </Stack>
        )
    }

    return (
        <Stack>
            <div className={classes.fileUpload}>
                <CustomDropzone setFile={setUploadedFile} />
            </div>
            <Button
                variant="contained"
                color="primary"
                disabled={!uploadedFile || !apiResource}
                onClick={() => {
                    return create_mutation.mutate({
                        file: uploadedFile!,
                        targetFileId: String(apiResource!.id),
                        uploader: String(user?.id),
                        path: apiResource!.path,
                        team: apiResource!.team,
                    })
                }}
            >
                Upload file
            </Button>
            <Collapse in={alertContent !== null}>{alertContent}</Collapse>
        </Stack>
    )
}

/**
 * Handle the upload of a file.
 * If a mapping is provided, the file will be processed in its entirety.
 * Otherwise, a preview of the first few rows will be extracted and
 * the file will have to be reuploaded once a mapping has been selected.
 */
export function UploadFilePage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const { user, api_config } = useCurrentUser()
    const navigate = useNavigate()
    const api = new FilesApi(api_config)
    const create_mutation = useMutation<
        AxiosResponse<ObservedFileCreate>,
        AxiosError,
        FilesApiFilesCreateRequest
    >({
        mutationFn: (data: FilesApiFilesCreateRequest) =>
            api.filesCreate.bind(api)(data),
        onSuccess: (data: AxiosResponse<ObservedFileCreate>) => {
            if (data) {
                navigate(`${PATHS[LOOKUP_KEYS.FILE]}/${data.data.id}`)
            }
        },
        onError: (error: AxiosError) => {
            setAlertContent(<AxiosErrorAlert error={error} />)
        },
    })
    const { classes } = useStyles()
    const [alertContent, setAlertContent] = useState<ReactNode | null>(null)
    const [error, setError] = useState<AxiosError | null>(
        user
            ? null
            : {
                  response: {
                      data: {
                          non_field_errors: [
                              'You must log in to upload files.',
                          ],
                      },
                      statusText: '',
                      status: 400,
                      headers: {},
                      config: {},
                  },
                  request: {},
                  isAxiosError: true,
                  toJSON: () => ({}),
                  config: {},
                  name: '',
                  message: '',
              },
    )
    const clearAlert = () => {
        setAlertContent(null)
        setError(null)
    }

    const display_data = (data: Partial<ObservedFileCreate>) => {
        const name = (data.name || uploadedFile?.name) ?? ''
        return {
            name: name,
            path: data.path ? data.path : `/${name}`,
            mapping: data.mapping ?? '',
            team: data.team ?? '',
            read_access_level: data.read_access_level,
            edit_access_level: data.edit_access_level,
            delete_access_level: data.delete_access_level,
        }
    }

    const upload = () => {
        if (!uploadedFile) throw new Error('No file to upload')
        return create_mutation.mutate({
            ...display_data(UndoRedo.current),
            file: uploadedFile,
            targetFileId: undefined,
            uploader: String(user?.id),
        })
    }

    // Ref wrapper for updating UndoRedo in useEffect
    const UndoRedo =
        useUndoRedoContext<Partial<CreateMutationVariablesType<ObservedFile>>>()
    const UndoRedoRef = useRef(UndoRedo)

    // Initialize UndoRedo or populate with observed file data
    useEffect(() => {
        const current = UndoRedoRef.current
        if (Object.keys(current).includes('current')) {
            if (!current.current || Object.keys(current.current).length === 0) {
                UndoRedoRef.current.set({
                    name: '',
                    path: '',
                    mapping: '',
                    team: '',
                    read_access_level: '',
                    edit_access_level: '',
                    delete_access_level: '',
                })
            }
        }
    }, [UndoRedoRef.current])

    return (
        <Stack>
            <h1>Upload data files</h1>
            <Typography>
                You can use this page to upload data files directly from your
                computer.
            </Typography>
            <Typography>
                Data files should be in one of the formats parsable by the Galv
                Harvesters. If in doubt, use .csv files!
            </Typography>
            <CardActionBar
                lookupKey={LOOKUP_KEYS.FILE}
                excludeContext={true}
                selectable={false}
                editable={true}
                editing={true}
                setEditing={() => {}}
                onUndo={UndoRedo.undo}
                onRedo={UndoRedo.redo}
                undoable={UndoRedo.can_undo}
                redoable={UndoRedo.can_redo}
                onEditSave={() => {
                    upload()
                    return false // Close action handled by mutation success callback
                }}
                onEditDiscard={() => {
                    if (
                        UndoRedo.can_undo &&
                        !window.confirm('Discard all changes?')
                    )
                        return false
                    UndoRedo.reset()
                    return true
                }}
            />
            {UndoRedo.current && (
                <PrettyObject
                    target={to_type_value_notation_wrapper(
                        UndoRedo.current as SerializableObject,
                        LOOKUP_KEYS.FILE,
                    )}
                    lookupKey={LOOKUP_KEYS.FILE}
                    edit_mode={true}
                    creating={true}
                    onEdit={(v) => {
                        UndoRedo.update(
                            from_type_value_notation(v) as Partial<
                                CreateMutationVariablesType<ObservedFile>
                            >,
                        )
                        clearAlert()
                    }}
                    fieldErrors={
                        Object.fromEntries(
                            Object.entries(error?.response?.data ?? {}).filter(
                                ([k]) => k !== 'non_field_errors',
                            ),
                        ) as Record<string, string>
                    }
                />
            )}
            <div className={classes.fileUpload}>
                <CustomDropzone setFile={setUploadedFile} />
            </div>
            <Button
                variant="contained"
                color="primary"
                disabled={!uploadedFile}
                onClick={upload}
            >
                Upload file
            </Button>
            <Collapse in={alertContent !== null}>{alertContent}</Collapse>
        </Stack>
    )
}

export default function WrappedUploadFilePage() {
    return (
        <UndoRedoProvider>
            <UploadFilePage />
        </UndoRedoProvider>
    )
}
