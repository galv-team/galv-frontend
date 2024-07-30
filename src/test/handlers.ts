import {http, HttpResponse, HttpResponseResolver} from 'msw'
import {
    access_levels,
    cell_chemistries,
    cell_families,
    cell_form_factors,
    cell_manufacturers,
    cell_models,
    cells,
    column_mappings,
    column_types,
    equipment_manufacturers,
    equipment_models,
    equipment_types,
    file_applicable_mappings,
    file_summary,
    files,
    schedule_identifiers,
    teams,
} from './fixtures/fixtures'
import {SerializerDescriptionSerializer} from '../Components/FetchResourceContext'

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

const DEBUG_TESTS = false

const debug = (...args: unknown[]) => {
    if (DEBUG_TESTS) {
        console.log(...args)
    }
}

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

/**
 * Mock responses for error testing
 *
 * Specifying these as either the root part of the URL or as the id of a resource will prompt the appropriate error.
 * E.g. `/error-404/` will return a 404 error, as will `/files/error-404/`
 *
 * The generic error simulates a network error.
 */
export const error_responses: Record<string, () => HttpResponse> = {
    'error-generic': () => HttpResponse.error(),
    'error-404': () => HttpResponse.json({detail: "Not found."}, { status: 404 }),
    'error-500': () => new HttpResponse(`<!DOCTYPE html>
<html lang="en">
<head>
<title>Error</title>
</head>
<body>
<h1>Server Error</h1>
<p>Sorry, the server has encountered an error.</p>
</body>`, { status: 500 }),
}

const build_get_endpoints =
    (resource_name: keyof typeof resources): (args: {request: {url: string}}) => HttpResponse =>
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
                debug('request.url', request.url.toString(), '-> description')
                return HttpResponse.json(dict)
            }

            const parts = url_extras
                .split('/')
                .filter((x) => x && /^\?/.test(x) === false)
            if (parts.length > 0) {
                const id = parts[0]

                // Handle mocking errors
                if (id in error_responses) {
                    debug('request.url', request.url.toString(), '-> error')
                    return error_responses[id]()
                }

                if (resource_name === 'files' && parts.length > 1) {
                    // Files are a special case because they have sub-pages mapped with /files/:id/:subpage
                    if (id !== files[0].id) {
                        throw new Error(
                            `Sub-pages are only implemented for file ${files[0].id}`,
                        )
                    }
                    if (parts[1] === 'summary') {
                        debug(
                            'request.url',
                            request.url.toString(),
                            '-> summary',
                        )
                        return HttpResponse.json(file_summary)
                    }
                    if (parts[1] === 'applicable_mappings') {
                        debug(
                            'request.url',
                            request.url.toString(),
                            '-> applicable_mappings',
                        )
                        return HttpResponse.json(file_applicable_mappings)
                    }
                }
                debug('request.url', request.url.toString(), '-> resource')
                return HttpResponse.json(data.find((x) => String(x.id) === id))
            }
            debug('request.url', request.url.toString(), '-> list')
            return HttpResponse.json(paginate(data, request.url.toString()))
        }

const build_stub_endpoints =
    (resource_name: keyof typeof resources): HttpResponseResolver =>
        ({ request }) => {
            debug(request.method, request.url.toString())
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
    // Errors
    ...Object.entries(error_responses).map(([k, v]) =>
        http.get(RegExp(`/${k}/`), v),
    ),
    // http.get('*', ({ request }) => {
    //     console.error(`Please add a handler for ${request.url.toString()}`)
    //     return HttpResponse.error()
    // }),
]
