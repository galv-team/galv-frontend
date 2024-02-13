import CardActionBar from "./CardActionBar";
import {get_url_components} from "./misc";
import PrettyObject from "./prettify/PrettyObject";
import useStyles from "../styles/UseStyles";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import Card, {CardProps} from "@mui/material/Card";
import clsx from "clsx";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import NumberInput from './NumberInput';
import {CopyBlock, a11yDark} from "react-code-blocks";
import Avatar from "@mui/material/Avatar";
import React, {useContext, useEffect, useRef, useState} from "react";
import ErrorCard from "./error/ErrorCard";
import {AxiosError, AxiosResponse} from "axios";
import {Serializable, SerializableObject} from "./TypeChanger";
import {
    API_HANDLERS,
    API_SLUGS,
    DISPLAY_NAMES,
    FIELDS,
    ICONS,
    LOOKUP_KEYS,
    LookupKey,
    PRIORITY_LEVELS
} from "../constants";
import ErrorBoundary from "./ErrorBoundary";
import UndoRedoProvider, {UndoRedoContext} from "./UndoRedoContext";
import {BaseResource} from "./ResourceCard";
import {Modal} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import {useSnackbarMessenger} from "./SnackbarMessengerContext";
import {Configuration, CreateTokenApi, type CreateKnoxTokenRequest, type KnoxTokenFull}from "@battery-intelligence-lab/galv";
import {useCurrentUser} from "./CurrentUserContext";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";

export function TokenCreator({setModalOpen,...cardProps}: {setModalOpen: (open: boolean) => void} & CardProps) {
    const { classes } = useStyles()
    const [name, setName] = useState<string>("")
    const [ttl, setTTL] = useState<number|undefined>(undefined)
    const [timeUnit, setTimeUnit] = useState<number>(1)
    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const [err, setErr] = useState<string>("")
    const [responseData, setResponseData] = useState<KnoxTokenFull|null>(null)
    const queryClient = useQueryClient()
    const create_mutation = useMutation<
        AxiosResponse<KnoxTokenFull>, AxiosError, CreateKnoxTokenRequest
    >(
        (data) => new CreateTokenApi(config).createTokenCreate(data),
        {
            onSuccess: (data) => {
                setErr("")
                setResponseData(data.data)
                queryClient.invalidateQueries([lookup_key, 'list'], {exact: true})
            },
            onError: (err) => {setErr(err.message)}
        }
    )

    const update_ttl = (v: number|undefined) => {
        const x = (v ?? 0) * timeUnit
        x > 0? setTTL(x) : setTTL(undefined)
    }

    const time_units = {
        "seconds": 1,
        "minutes": 60,
        "hours": 60 * 60,
        "days": 60 * 60 * 24,
        "weeks": 60 * 60 * 24 * 7
    }

    const lookup_key = LOOKUP_KEYS.TOKEN

    const ICON = ICONS[lookup_key]

    const cardHeader = <CardHeader
        id={get_modal_title(lookup_key, 'title')}
        avatar={<Avatar variant="square"><ICON /></Avatar>}
        title={`Create a new ${DISPLAY_NAMES[lookup_key]}`}
    />
    const cardBody =
        <Stack spacing={1}>
            <TextField
                label="Token name"
                id="token-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Stack direction="row" spacing={1}>
                <NumberInput
                    aria-label="Time-to-live"
                    placeholder="Token time-to-live"
                    id="token-ttl"
                    step={1}
                    min={0}
                    value={ttl || 0}
                    onChange={(_e, v) => update_ttl(v)}
                />
                <Select
                    labelId="select-time-unit-label"
                    id="select-time-unit"
                    value={timeUnit}
                    label="Unit"
                    onChange={(e) => setTimeUnit(e.target.value as number)}
                >
                    {Object.entries(time_units).map(([k, v]) => <MenuItem key={v} value={v}>{k}</MenuItem>)}
                </Select>
            </Stack>
            {ttl === undefined && <Typography>Tokens with no TTL value will be valid forever.</Typography>}
            <Button
                variant="contained"
                color="success"
                onClick={() => create_mutation.mutate({name, ttl})} disabled={name === ""}
            >
                Create
            </Button>
        </Stack>

    const showResponse = <Stack spacing={1}>
        <Typography>
            Your token code is shown below.
            This is the only time you will see your token code.
            You will not be able to retrieve it again.<br/>
            <b>Make sure to copy it now.</b>
        </Typography>
        <CopyBlock
            text={responseData?.token ?? ""}
            theme={a11yDark}
            language={"html"}
            wrapLongLines
            showLineNumbers={false}
            codeBlock={true}
        />
        <Button variant="contained" onClick={() => setModalOpen(false)}>Close</Button>
    </Stack>

    const showErr = <Stack sx={{m: 2}}>
        <Typography color="error">
            Error creating token: {err}
        </Typography>
    </Stack>


    return <Card
        className={clsx(classes.itemCard, classes.itemCreateCard)}
        {...cardProps}
    >
        {cardHeader}
        <CardContent sx={{
            height: (t) => `calc(100% - ${t.spacing(8)})`,
            overflowY: "auto",
            "& li": {marginTop: (t) => t.spacing(0.5)},
            "& table": {borderCollapse: "separate", borderSpacing: (t) => t.spacing(0.5)},
            m: 2
        }}>
            {err && showErr}
            {create_mutation.isLoading? <Skeleton variant="rounded" height="6em"/> :
                responseData? showResponse :
                    cardBody}
        </CardContent>
    </Card>
}

export function ResourceCreator<T extends BaseResource>(
    { lookup_key, initial_data, onCreate, onDiscard, ...cardProps}:
        {lookup_key: LookupKey, initial_data?: object, onCreate: (error?: unknown) => void, onDiscard: () => void} &
        CardProps
) {
    const { classes } = useStyles();

    // Ref wrapper for updating UndoRedo in useEffect
    const UndoRedo = useContext(UndoRedoContext)
    const UndoRedoRef = useRef(UndoRedo)

    useEffect(() => {
        const template_object: {[key: string]: Serializable} = {}
        Object.entries(FIELDS[lookup_key])
            .filter((v) => v[1].priority !== PRIORITY_LEVELS.HIDDEN)
            .forEach(([k, v]) => {
                if (!v.readonly || v.createonly) {
                    if (initial_data?.[k as keyof typeof initial_data] !== undefined)
                        template_object[k] = initial_data[k as keyof typeof initial_data]
                    else
                        template_object[k] = v.many? [] : ""
                }
            })
        if (initial_data !== undefined) {
            Object.entries(initial_data).forEach(([k, v]) => {
                if (!(k in FIELDS[lookup_key]))
                    template_object[k] = v as Serializable
            })
        }
        UndoRedoRef.current.set(template_object)
    }, [initial_data, lookup_key])

    const config = new Configuration({
        basePath: process.env.VITE_GALV_API_BASE_URL,
        accessToken: useCurrentUser().user?.token
    })
    const api_handler = new API_HANDLERS[lookup_key](config)
    const post = api_handler[
        `${API_SLUGS[lookup_key]}Create` as keyof typeof api_handler
        ] as (data: SerializableObject) => Promise<AxiosResponse<T>>

    // Mutations for saving edits
    const {postSnackbarMessage} = useSnackbarMessenger()
    const queryClient = useQueryClient()
    const create_mutation =
        useMutation<AxiosResponse<T>, AxiosError, SerializableObject>(
            (data: SerializableObject) => post.bind(api_handler)(data),
            {
                onSuccess: (data, variables, context) => {
                    if (data === undefined) {
                        console.warn("No data in mutation response", {data, variables, context})
                        return
                    }
                    queryClient.invalidateQueries([lookup_key, 'list'], {exact: true})
                    // Also invalidate any query mentioned in the response
                    const invalidate = (url: Serializable|Serializable[]): void => {
                        if (url instanceof Array)
                            return url.forEach(invalidate)
                        if (typeof url !== "string") return
                        const components = get_url_components(url)
                        if (components)
                            queryClient.invalidateQueries([components.lookup_key, components.resource_id], {exact: true})
                    }
                    Object.values(data.data).forEach((v) => {
                        if (typeof v === 'string' || v instanceof Array)
                            invalidate(v)
                    })
                    // Also invalidate autocomplete cache because we may have updated options
                    queryClient.invalidateQueries(['autocomplete'])
                    onCreate()
                },
                onError: (error, variables, context) => {
                    console.error(error, {variables, context})
                    const d = error.response?.data as SerializableObject
                    const firstError = Object.entries(d)[0]
                    postSnackbarMessage({
                        message: <Stack>
                            <span>{`Error creating new ${DISPLAY_NAMES[lookup_key]} 
                        (HTTP ${error.response?.status} - ${error.response?.statusText}).`}</span>
                            <span style={{fontWeight: "bold"}}>{`${firstError[0]}: ${firstError[1]}`}</span>
                            {Object.keys(d).length > 1 && <span>+ {Object.keys(d).length - 1} more</span>}
                        </Stack>,
                        severity: 'error'
                    })
                    onCreate(error)
                },
            })

    // The card action bar controls the expanded state and editing state
    const action = <CardActionBar
        lookup_key={lookup_key}
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
            create_mutation.mutate(UndoRedo.current)
            return true
        }}
        onEditDiscard={() => {
            if (UndoRedo.can_undo && !window.confirm("Discard all changes?"))
                return false
            UndoRedo.reset()
            onDiscard()
            return true
        }}
    />

    const ICON = ICONS[lookup_key]

    const cardHeader = <CardHeader
        id={get_modal_title(lookup_key, 'title')}
        avatar={<Avatar variant="square"><ICON /></Avatar>}
        title={`Create a new ${DISPLAY_NAMES[lookup_key]}`}
        action={action}
    />

    const cardBody = <CardContent sx={{
        height: (t) => `calc(100% - ${t.spacing(8)})`,
        overflowY: "auto",
        "& li": {marginTop: (t) => t.spacing(0.5)},
        "& table": {borderCollapse: "separate", borderSpacing: (t) => t.spacing(0.5)},
    }}>
        {UndoRedo.current && <PrettyObject
            target={UndoRedo.current}
            lookup_key={lookup_key}
            edit_mode={true}
            creating={true}
            onEdit={UndoRedo.update}
        />}
    </CardContent>

    return <Card
        className={clsx(classes.itemCard, classes.itemCreateCard)}
        {...cardProps}
    >
        {cardHeader}
        {cardBody}
    </Card>
}

export const get_modal_title = (lookup_key: LookupKey, suffix: string) => `create-${lookup_key}-modal-${suffix}`

export default function WrappedResourceCreator<T extends BaseResource>(props: {lookup_key: LookupKey} & CardProps) {
    const [modalOpen, setModalOpen] = useState(false)

    const get_can_create = (lookup_key: LookupKey) => {
        if (lookup_key === LOOKUP_KEYS.TOKEN) return true
        const fields = FIELDS[lookup_key]
        return Object.keys(fields).includes('team')
    }

    const ADD_ICON = ICONS.CREATE

    return get_can_create(props.lookup_key) ? <UndoRedoProvider>
        <Tooltip title={`Create a new ${DISPLAY_NAMES[props.lookup_key]}`}>
            <IconButton onClick={() => setModalOpen(true)} sx={{width: "min-content", placeSelf: "center"}}>
                <ADD_ICON fontSize="large"/>
            </IconButton>
        </Tooltip>
        <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            aria-labelledby={get_modal_title(props.lookup_key, 'title')}
            sx={{padding: (t) => t.spacing(4)}}
        >
            <div>
                <ErrorBoundary
                    fallback={(error: Error) => <ErrorCard
                        message={error.message}
                        header={
                            <CardHeader
                                avatar={<Avatar variant="square">E</Avatar>}
                                title="Error"
                                subheader={`Error with ResourceCard for creating new ${props.lookup_key}`
                                }
                            />
                        }
                    />}
                >
                    {props.lookup_key === LOOKUP_KEYS.TOKEN?
                        <TokenCreator setModalOpen={setModalOpen} {...props} /> :
                        <ResourceCreator<T>
                            onCreate={() => setModalOpen(false)}
                            onDiscard={() => setModalOpen(false)}
                            {...props}
                        />}
                </ErrorBoundary>
            </div>
        </Modal>
    </UndoRedoProvider> : <></>
}