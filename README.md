# Galv frontend (React app)

> A metadata secretary for battery science

![GitHub package.json dynamic](https://img.shields.io/github/package-json/version/galv-team/galv-frontend)

[![Storybook](https://img.shields.io/badge/Storybook-white?logo=storybook&logoColor=%23FF4785)](https://main--66a8c74027ced8fef31d653c.chromatic.com/)
[![Chromatic Storybook deployment](https://img.shields.io/badge/View%20on%20Chromatic-white?logo=chromatic&logoColor=%23FC521F)](https://www.chromatic.com/library?appId=66a8c74027ced8fef31d653c&branch=main)

[![Jest CI](https://github.com/galv-team/galv-frontend/actions/workflows/test_integration.yml/badge.svg)](https://github.com/galv-team/galv-frontend/actions/workflows/test_integration.yml)
[![Build docs](https://github.com/galv-team/galv-frontend/actions/workflows/docs.yml/badge.svg)](https://github.com/galv-team/galv-frontend/actions/workflows/docs.yml)

The Galv frontend is a user-friendly web interface for interacting with the [Galv REST API](https://github.com/galv-team/galv-backend).

## Galv Project

-   [Backend](https://github.com/galv-team/galv-backend)
-   [**Frontend**](https://github.com/galv-team/galv-frontend)
-   [Harvester](https://github.com/galv-team/galv-harvester)

For more complete documentation, see the
[Galv Frontend documentation](https://galv-team.github.io/galv-frontend/).

## Deploying

The frontend is deployed as a Docker container.  
The Dockerfile is in the root directory of this repository.

To deploy the frontend, you will need to set the following environment variables in the Docker container:

-   `GALV_API_ROOT_URL`: the URL of the Galv REST API you are targeting with the frontend

You can set these variables either by editing the Dockerfile, or by passing them in as arguments to `docker run` or `docker-compose up`.
If you're using `docker-compose`, you can set them in the `environment` section of the `frontend` service in the `docker-compose.yml` file.

## Development

Development is most easily done by using the provided Dockerfile and docker-compose.yml files. The docker-compose.yml file will start a postgres database and the Django server. The Django server will automatically reload when changes are made to the code.
This will create four containers:

-   a `backend` container that runs a copy of the latest version of the Galv backend
-   a `postgres` container that runs a postgres database for the backend
-   the `frontend` container that runs the frontend

The following command will start the server:

```bash
docker-compose up frontend
```

The server will be available at http://localhost:8002.
If you need access to the backend, it will be available at http://localhost:8081.

### Gotchas

-   The `src` directory is mounted as a volume in the Docker container, so changes made outside that directory will not be automatically reflected in the container.

## Testing

There are unit tests and Cypress end-to-end tests.  
The unit tests are run with Jest and the end-to-end tests are run with Cypress.

### Unit tests

Unit tests are kept to a minimum, and used to ensure that novel logic in the components works as expected.

To run the unit tests, run the following command:

```bash
docker-compose up frontend_test
```

Remember to add the `--build` flag if you have made changes to the frontend code outside the `src` directory.

### End-to-end tests

End-to-end tests are used to ensure that the frontend works as expected from the user's perspective. They are run with Cypress.

To run the end-to-end tests, run the following command:

```bash
docker-compose up frontend_test_e2e
```

Remember to add the `--build` flag if you have made changes to the frontend code outside the `src` directory.

To develop end-to-end tests, you can use the Cypress GUI. To do this, run the following command:

```bash
pnpm run cypress:open
```
