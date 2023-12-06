# Galv frontend (React app)

The Galv frontend is a user-friendly web interface for interacting with the [Galv REST API](/Battery-Intelligence-Lab/galv-backend/).

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
- a `mockserver` container that mocks the Galv REST API
- a `setup-expectations` container that sets up the mockserver's expectations from the Galv REST API specification
- the `frontend` container that runs the frontend

The following command will start the server:

```bash
docker-compose up app
```

The server will be available at http://localhost:8002. 
If you need access to the mockserver, it will be available at http://localhost:1080.

## Testing

There are unit tests and Cypress end-to-end tests.  
The unit tests are run with Jest and the end-to-end tests are run with Cypress.

### Unit tests

Unit tests are kept to a minimum, and used to ensure that novel logic in the components works as expected.

### End-to-end tests

End-to-end tests are used to ensure that the frontend works as expected from the user's perspective.  They are run with Cypress.
