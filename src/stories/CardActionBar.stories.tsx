import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import CardActionBar, {CardActionBarProps} from '../Components/CardActionBar'
import {LOOKUP_KEYS} from "../constants";
import {cell_families, cells, column_mappings, column_types, files, teams} from "../test/fixtures/fixtures";
import {restHandlers} from "../test/handlers";
import FetchResourceContextProvider from "../Components/FetchResourceContext";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {http, HttpResponse} from "msw";
import {ReactElement} from "react";
import ApiResourceContextProvider from "../Components/ApiResourceContext";
import SelectionManagementContextProvider from "../Components/SelectionManagementContext";
import {fn} from "@storybook/test";
import { useArgs } from '@storybook/preview-api';
import CardContent from "@mui/material/CardContent";
import {CardActions} from "@mui/material";
import Card from "@mui/material/Card";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/CardActionBar',
    component: CardActionBar,
    decorators: [
        withRouter,
        (Story: ReactElement, context: { args: CardActionBarProps & {resource_id? : string}}) => (
            <QueryClientProvider client={new QueryClient()}>
                <SelectionManagementContextProvider>
                    <FetchResourceContextProvider>
                        <ApiResourceContextProvider
                            lookup_key={context.args.lookup_key ?? LOOKUP_KEYS.CELL}
                            resource_id={context.args.resource_id ?? cells[0].id}
                        >
                            <Story />
                        </ApiResourceContextProvider>
                    </FetchResourceContextProvider>
                </SelectionManagementContextProvider>
            </QueryClientProvider>),
    ],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
        msw: {
            handlers: restHandlers,
        }
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        lookup_key: {
            options: Object.values(LOOKUP_KEYS),
        },
        resource_id: {
            options: [
                ...cells,
                ...cell_families,
                ...teams,
                ...column_types,
                ...files,
                ...column_mappings,
            ].map((r) => r.id),
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        resource_id: cells[0].id,
        lookup_key: LOOKUP_KEYS.CELL
    },
    render: function Render(args) {
        const [{ editing, expanded }, updateArgs] = useArgs();

        function onChange() {
            updateArgs({ editing: !editing });
        }

        return <Card>
            <CardActions>
                <CardActionBar
                    {...args}
                    setEditing={onChange}
                    onEditDiscard={() => updateArgs({ editing: false })}
                    editing={editing}
                    setExpanded={() => updateArgs({ expanded: !expanded })}
                />
            </CardActions>
            {expanded && <CardContent>Expanded view!</CardContent>}
        </Card>
    },
} satisfies Meta<typeof CardActionBar>

export default meta
type Story = StoryObj<typeof meta>

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const BasicActions: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: true,
        excludeContext: false,
        editable: true,
        onEditSave: fn(),
        onFork: fn(),
        undoable: true,
        redoable: true,
        onUndo: fn(),
        onRedo: fn(),
        destroyable: true,
        reimportable: true,
        onDestroy: fn(),
        onReImport: fn(),
    },
}

export const NonEditable: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: true,
        excludeContext: false,
    },
}

export const NonSelectable: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: false,
        excludeContext: false,
    },
}

export const NoContext: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: true,
        excludeContext: true,
    },
}
