# Galv frontend (React app)
> A metadata secretary for battery science

[![Jest CI](https://github.com/Battery-Intelligence-Lab/galv-frontend/actions/workflows/test.yml/badge.svg)](https://github.com/Battery-Intelligence-Lab/galv-frontend/actions/workflows/test.yml)
[![Cypress CI](https://github.com/Battery-Intelligence-Lab/galv-frontend/actions/workflows/test_e2e.yml/badge.svg)](https://github.com/Battery-Intelligence-Lab/galv-frontend/actions/workflows/test_e2e.yml)

The Galv frontend is a user-friendly web interface for interacting with the [Galv REST API](/Battery-Intelligence-Lab/galv-backend/).

## Galv Project
- [Specification](https://github.com/Battery-Intelligence-Lab/galv-spec)
- [Backend](https://github.com/Battery-Intelligence-Lab/galv-backend)
- [**Frontend**](https://github.com/Battery-Intelligence-Lab/galv-frontend)
- [Harvester](https://github.com/Battery-Intelligence-Lab/galv-harvester)

## Deploying

The frontend is deployed as a Docker container.  
The Dockerfile is in the root directory of this repository.  

To deploy the frontend, you will need to set the following environment variables in the Docker container:
- `GALV_API_ROOT_URL`: the URL of the Galv REST API you are targeting with the frontend

You can set these variables either by editing the Dockerfile, or by passing them in as arguments to `docker run` or `docker-compose up`.
If you're using `docker-compose`, you can set them in the `environment` section of the `frontend` service in the `docker-compose.yml` file.

## Development

Development is most easily done by using the provided Dockerfile and docker-compose.yml files.  The docker-compose.yml file will start a postgres database and the Django server.  The Django server will automatically reload when changes are made to the code.
This will create three containers:
- a `backend` container that runs a copy of the latest version of the Galv backend
- a `postgres` container that runs a postgres database for the backend
- the `frontend` container that runs the frontend

The following command will start the server:

```bash
docker-compose up frontend
```

The server will be available at http://localhost:8002. 
If you need access to the backend, it will be available at http://localhost:8081.

### Expectations

The expectations are set up by the `setup-expectations` container. 
This tries to read from the `glav-spec.json` file in the [galv-spec](/Battery-Intelligence-Lab/galv-spec) repository.
If you're developing without internet access, you can modify the `docker-compose.yml` file to mount a local copy of 
the spec file into the `mockserver` container and modify the `setup-expectations` container to instruct
mockserver to use that file instead.

### Gotchas

- The `src` directory is mounted as a volume in the Docker container, so changes made outside that directory will not be automatically reflected in the container.

## Testing

There are unit tests and Cypress end-to-end tests.  
The unit tests are run with Jest and the end-to-end tests are run with Cypress.

### Unit tests

Unit tests are kept to a minimum, and used to ensure that novel logic in the components works as expected.

To run the unit tests, run the following command:

```bash
docker-compose up frontend_test
```

### End-to-end tests

End-to-end tests are used to ensure that the frontend works as expected from the user's perspective.  They are run with Cypress.

To run the end-to-end tests, run the following command:

```bash
docker-compose up frontend_test_e2e
```

To develop end-to-end tests, you can use the Cypress GUI.  To do this, run the following command:

```bash
pnpm run cypress:open
```
