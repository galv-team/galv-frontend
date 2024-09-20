import type { Meta, StoryObj } from '@storybook/react'
import { withRouter } from 'storybook-addon-remix-react-router'
import CardActionBar, {
    CardActionBarProps,
} from '../../Components/CardActionBar'
import { LOOKUP_KEYS } from '../../constants'
import { cells } from '../../test/fixtures/fixtures'
import { restHandlers } from '../../test/handlers'
import FetchResourceContextProvider from '../../Components/FetchResourceContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import ApiResourceContextProvider from '../../Components/ApiResourceContext'
import SelectionManagementContextProvider from '../../Components/SelectionManagementContext'
import { expect, fn, userEvent, within } from '@storybook/test'
import { useArgs } from '@storybook/preview-api'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Card from '@mui/material/Card'

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
    title: 'Utilities/CardActionBar',
    component: CardActionBar,
    decorators: [
        withRouter,
        (
            Story: ReactElement,
            context: { args: CardActionBarProps & { resourceId?: string } },
        ) => (
            <QueryClientProvider client={new QueryClient()}>
                <SelectionManagementContextProvider>
                    <FetchResourceContextProvider>
                        <ApiResourceContextProvider
                            lookupKey={
                                context.args.lookupKey ?? LOOKUP_KEYS.CELL
                            }
                            resourceId={context.args.resourceId ?? cells[0].id}
                        >
                            <Story />
                        </ApiResourceContextProvider>
                    </FetchResourceContextProvider>
                </SelectionManagementContextProvider>
            </QueryClientProvider>
        ),
    ],
    parameters: {
        // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
        layout: 'centered',
        msw: {
            handlers: restHandlers,
        },
    },
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        lookupKey: {
            options: Object.values(LOOKUP_KEYS),
        },
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {
        lookupKey: LOOKUP_KEYS.CELL,
    },
    render: function Render(args) {
        const [{ editing, expanded }, updateArgs] = useArgs()

        function onChange() {
            updateArgs({ editing: !editing })
        }

        return (
            <Card>
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
        )
    },
} satisfies Meta<typeof CardActionBar>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The `CardActionBar` component is a utility component that provides a set of
 * buttons for common actions on a resource. It is used in the `ResourceCard`
 * component.
 */
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

/**
 * If the resource can't be edited by the user, there won't be an edit button.
 */
export const NonEditable: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: true,
        excludeContext: false,
    },
}

/**
 * If the resource can't be selected by the user, there won't be a select button.
 */
export const NonSelectable: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: false,
        excludeContext: false,
    },
}

/**
 * The resource doesn't have to be in a context to be displayed.
 */
export const NoContext: Story = {
    args: {
        editing: false,
        expanded: false,
        selectable: true,
        excludeContext: true,
    },
}

/**
 * The card will expand when the user clicks the expand button
 */
export const Expands: Story = {
    args: {
        editable: false,
        expanded: false,
    },
    play: async ({ canvasElement }) => {
        // Check the buttons work
        const expandButton = within(canvasElement).getByRole('button', {
            name: /show details/i,
        })
        await userEvent.click(expandButton)
        within(canvasElement).getByText('Expanded view!')
    },
}

/**
 * The card will collapse when the user clicks the collapse button
 */
export const Collapses: Story = {
    args: {
        editable: false,
        expanded: true,
    },
    play: async ({ canvasElement }) => {
        within(canvasElement).getByText('Expanded view!')
        const collapseButton = within(canvasElement).getByRole('button', {
            name: /hide details/i,
        })
        await userEvent.click(collapseButton)
        const text = await within(canvasElement).queryByText('Expanded view!')
        await expect(text).toBeNull()
    },
}
