import { PATHS } from '../../src/constants'

describe('template spec', () => {
    it('passes', () => {
        cy.intercept(
            {
                method: 'GET',
                url: `${PATHS.Cell}`,
            },
            { fixture: PATHS.Cell.replace(/^\//, '') },
        )
        cy.intercept(
            {
                method: 'GET',
                url: `${PATHS.Cell}/*`,
            },
            async (req) => {
                const id = req.url.split('/').pop()
                const cells = await cy.fixture(PATHS.Cell.replace(/^\//, ''))
                req.reply({
                    body: cells.results.find((cell) => cell.uuid === id),
                })
            },
        )
        cy.visit('http://localhost/')
    })
})
