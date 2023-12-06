import {PATHS} from "../../src/constants";

describe('template spec', () => {

    it('passes', () => {
        cy.intercept({
                method: 'GET',
                url: `${PATHS.CELL}`
            },
            { fixture: PATHS.CELL.replace(/^\//, "") }
        )
        cy.intercept({
                method: 'GET',
                url: `${PATHS.CELL}/*`
            },
            async (req) => {
                const id = req.url.split('/').pop()
                const cells = await cy.fixture(PATHS.CELL.replace(/^\//, ""))
                req.reply({
                    body: cells.results.find((cell) => cell.uuid === id)
                })
            }
        )
        cy.visit('http://localhost/')
    })
})