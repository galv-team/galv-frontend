import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { HttpResponse, http, HttpResponseResolver } from 'msw'
import {
    access_levels,
    cells,
    cell_families,
    teams,
    column_types,
    files,
    cell_models,
    cell_manufacturers,
    cell_form_factors,
    cell_chemistries,
    equipment_types,
    equipment_manufacturers,
    equipment_models,
    schedule_identifiers,
    column_mappings,
    file_summary,
    file_applicable_mappings,
} from './fixtures/fixtures'

const resources = {
    cells,
    cell_families,
    teams,
    column_types,
    files,
    cell_models,
    cell_manufacturers,
    cell_form_factors,
    cell_chemistries,
    equipment_types,
    equipment_manufacturers,
    equipment_models,
    schedule_identifiers,
    column_mappings,
} as const

import { SerializerDescriptionSerializer } from '../Components/FetchResourceContext'

const paginate = (results: unknown[], url: string) => {
    const url_base = /(.*)\?/.exec(url)
    const re_offset = /offset=(\d+)/.exec(url)
    const re_limit = /limit=(\d+)/.exec(url)
    const offset = re_offset ? parseInt(re_offset[1]) : 0
    const limit = re_limit ? parseInt(re_limit[1]) : 10
    if (offset >= results.length)
        return {
            results: [],
            count: results.length,
            next: null,
            previous: null,
        }
    const subset = results.slice(offset, offset + limit)
    return {
        results: subset,
        count: subset.length,
        next:
            offset + limit < results.length
                ? `${url_base}?offset=${offset + limit}&limit=${limit}`
                : null,
        previous:
            offset - limit >= 0
                ? `${url_base}?offset=${offset - limit}&limit=${limit}`
                : null,
    }
}

const build_get_endpoints =
    (resource_name: keyof typeof resources): HttpResponseResolver =>
    ({ request }) => {
        const url_extras = request.url.split(resource_name).pop() ?? ''

        const data = resources[resource_name]
        // If there's a description request, return the description
        if (/describe\/$/.test(url_extras)) {
            const d = data[0]
            const dict: SerializerDescriptionSerializer = {}
            for (const key in d) {
                if (['custom_properties'].includes(key)) continue
                dict[key as keyof typeof d] = {
                    type: typeof d[key as keyof typeof d],
                    many: Array.isArray(d[key as keyof typeof d]),
                    help_text: key,
                    required: false,
                    read_only: ['id', 'url'].includes(key),
                    write_only: false,
                    create_only: false,
                    allow_null: false,
                    default: null,
                    choices: null,
                }
            }
            console.log('request.url', request.url.toString(), '-> description')
            return HttpResponse.json(dict)
        }

        const parts = url_extras
            .split('/')
            .filter((x) => x && /^\?/.test(x) === false)
        if (parts.length > 0) {
            if (resource_name === 'files' && parts.length > 1) {
                // Files are a special case because they have sub-pages mapped with /files/:id/:subpage
                if (parts[0] !== files[0].id) {
                    throw new Error(
                        `Sub-pages are only implemented for file ${files[0].id}`,
                    )
                }
                if (parts[1] === 'summary') {
                    console.log(
                        'request.url',
                        request.url.toString(),
                        '-> summary',
                    )
                    return HttpResponse.json(file_summary)
                }
                if (parts[1] === 'applicable_mappings') {
                    console.log(
                        'request.url',
                        request.url.toString(),
                        '-> applicable_mappings',
                    )
                    return HttpResponse.json(file_applicable_mappings)
                }
            }
            const id = parts[0]
            console.log('request.url', request.url.toString(), '-> resource')
            return HttpResponse.json(data.find((x) => String(x.id) === id))
        }
        console.log('request.url', request.url.toString(), '-> list')
        return HttpResponse.json(paginate(data, request.url.toString()))
    }

const build_stub_endpoints =
    (resource_name: keyof typeof resources): HttpResponseResolver =>
    ({ request }) => {
        console.log(request.method, request.url.toString())
        const url_extras = request.url.split(resource_name).pop() ?? ''
        const data = resources[resource_name]
        const parts = url_extras
            .split('/')
            .filter((x) => x && /^\?/.test(x) === false)
        if (parts.length > 0) {
            const id = parts[0]
            return HttpResponse.json(data.find((x) => x.id === id))
        }
        throw new Error(`No id found in ${request.url.toString()}`)
    }

export const restHandlers = [
    ...Object.keys(resources).map((r) =>
        http.get(
            RegExp(`/${r}/`),
            build_get_endpoints(r as keyof typeof resources),
        ),
    ),
    ...Object.keys(resources).map((r) =>
        http.patch(
            RegExp(`/${r}/`),
            build_stub_endpoints(r as keyof typeof resources),
        ),
    ),
    ...Object.keys(resources).map((r) =>
        http.post(
            RegExp(`/${r}/`),
            build_stub_endpoints(r as keyof typeof resources),
        ),
    ),
    http.get(/access_levels/, () => {
        return HttpResponse.json(access_levels)
    }),
    http.get('*', ({ request }) => {
        console.error(`Please add a handler for ${request.url.toString()}`)
        return HttpResponse.error()
    }),
]
const server = setupServer(...restHandlers)

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

//  Close server after all tests
afterAll(() => server.close())

// Reset handlers after each test `important for test isolation`
afterEach(() => server.resetHandlers())

// runs a clean after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup()
})
