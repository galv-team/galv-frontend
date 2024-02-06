################################################################################
Galv Development Guide
################################################################################

********************************************************************************
Running a development instance
********************************************************************************

The Galv frontend requires an instance of the backend to be running.
To assist in development, a ``docker-compose`` file is provided to run
an instance of the frontend and backend together.

To bring up the development instance, run the following command:

.. code-block:: shell

	docker-compose up -d frontend

This will start the ``frontend`` and ``backend`` servers, and the ``postgres`` database.
It will also start a `mailhog <https://github.com/mailhog/MailHog>`_ instance
to handle the activation emails the backend generates.

You can now log in to the frontend at `<https://localhost:8002>`_.

Development container details
================================================================================

Several containers are included in the ``docker-compose.yml`` file for testing and development purposes:

* Frontend Vite server:
	* ``frontend`` runs the frontend with ``Vite``
		* Note: the server has hot-reloading disabled by default because it was crashing Docker
* Backend containers:
	* ``backend`` runs the latest release of the backend with ``Django`` and ``Gunicorn``
	* ``postgres`` runs the database the backend uses
	* ``mailhog`` runs a mail server so the backend can send activation emails
* Testing containers:
	* ``frontend_test`` runs the frontend unit tests with ``Jest``
	* ``frontend_test_e2e`` runs the frontend end-to-end tests with ``Cypress``
	* ``frontend_build`` builds the frontend (useful for testing the production build)
* Documentation container:
	* ``docs`` builds this documentation and runs a server with auto-reloading

Container ports
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

* The ``frontend`` is available at ``localhost:8002`` by default (the backend's development port is 8001)
* The ``backend`` instance is available at ``localhost:8082``
* ``Mailhog``'s web interface is available at ``localhost:8025``
* The ``documentation`` is available at ``localhost:8003``

Customizing the development deployment
================================================================================

The services and their settings can be changed in the ``docker-compose.yml`` file.

In particular, if your frontend is targetting a different backend,
you will need to change the ``VITE_GALV_API_BASE_URL`` environment variable in the frontend container.
Note that you will also need to ensure your target backend has the correct
``FRONTEND_VIRTUAL_HOST`` environment variable set.

********************************************************************************
Testing
********************************************************************************

Tests are run automatically with GitHub Actions (``.github/workflows/test_*.yml``),
and can also be run manually during development.
The tests are run in Docker containers to ensure a consistent environment,
both in the CI and locally.

Unit tests
================================================================================

Unit tests are kept to a minimum, and should target specific functionality.
Unit tests are found in the ``src/test`` directory.
The test runner is ``Jest``, and it uses ``Vite`` to prepare the test code.

The unit test container can be run with the following command:

.. code-block:: bash

  docker-compose run --rm --build frontend_test

End-to-end tests
================================================================================

End-to-end (e2e) tests are run with ``Cypress``.
These tests are used to ensure that flows through the application work as expected.

The e2e test container can be run with the following command:

.. code-block:: bash

  docker-compose run --rm --build frontend_test_e2e

********************************************************************************
Versioning
********************************************************************************

The Galv project uses `Semantic Versioning <https://semver.org/>`_.

Syncing with the backend version
================================================================================

When a new release of the Galv backend is made, it will automatically produce
a new Docker image and push it to the GitHub container registry.
It will also produce a new ``typescript-axios`` API client for the frontend
and release it to NPM.
You should ensure that the version of the frontend API client is up to date
with the backend you are targeting by editing the
``@battery-intelligence-lab/galv-backend`` dependency in the ``package.json`` file.

Releasing a new Frontend version
================================================================================

This documentation provides documentation for each release of the frontend.
When a new release is made, the following steps should be taken:

* Update the version number in the ``package.json`` file
* Update the version number in ``docs/source/conf.py``
* Add the new version to ``docs/tags.json`` with the version number prefixed with a 'v'

The new version should be tagged in the git repository with the version number prefixed with a 'v'.
For example, if the new version is 1.2.3, the tag should be ``v1.2.3``.
When the tag is pushed to the repository, the GitHub Actions workflow will automatically
issue a new release of the Frontend, build a container and push it to the GitHub container registry,
and publish updated documentation to GitHub Pages.

********************************************************************************
Understanding the application
********************************************************************************

This section provides a brief overview of the technology
used to implement the different parts of the project,
and a guide to some of the :ref:`Custom context hooks` and
:ref:`Custom components` the project uses.

Technology
================================================================================

Typescript
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The Galv frontend is written in `TypeScript <https://www.typescriptlang.org/>`_,
a statically-typed superset of JavaScript.
We use TypeScript to catch errors early and provide a better development experience.

When contributing to the frontend, please ensure that your code is written in TypeScript,
and that you have added type annotations where necessary.
This means that you should not use the ``any`` type, and should use the ``unknown`` type
where you are not sure of the type of a value.

React
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The frontend uses `React <https://reactjs.org/>`_, to provide a fast and responsive user interface.
React orders the UI into components, which are then composed together to form the application.
Components keep logical parts of the UI separate, allow consistent styling and behaviour,
support accessibility (a11y), make the flow of data through the application more transparent,
and make the application easier to maintain.

Material-UI
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

`Material-UI <https://material-ui.com/>`_ offers a suite of common components
that are styled according to the Material Design guidelines.
It provides a consistent look and feel to the application, and reduces the amount of custom styling required.

ReactQuery
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

It uses `ReactQuery <https://tanstack.com/query/latest/docs/framework/react/reference/useQuery>`_
to cache calls made to the REST API and reduce loading times.
It also provides a way to manage the state of the application in a more predictable way.

Codebase
================================================================================

The codebase is designed to be as modular as possible.
This means that the number of components is kept to a minimum,
and their behaviour is manipulated by values in ``constants.ts``.

Custom context hooks
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The frontend has a number of custom hooks that are used to manage state and side effects.
The most important of these are:

* ``FetchResourceContext``
	* Wraps the ``useQuery`` and ``useInfiniteQuery`` hooks from ``react-query`` to provide a consistent way to fetch resources from the backend
	* Covers both ``list`` and ``detail`` views
* ``ApiResourceContext``
	* Provides a consistent interface for resources whether or not they have a 'family' parent resource
* ``CurrentUserContext``
	* Provides a consistent way to access the current user, login, and open the login dialog
* ``SnackbarContext``
	* Provides a consistent way to queue and show snackbar messages
* ``SelectionManagementContext``
	* Provides a way to manage selection of items across page navigation
* ``FilterContext``
	* Provides a unified way to filter resources
* ``UndoRedoContext``
	* Provides a way to manage undo and redo actions

Custom components
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The frontend has a limited number of custom components.
The behaviour of these components is manipulated by values in ``constants.ts``,
allowing for a reduction in repetition of code across many otherwise similar components.

Many of these components will take a ``lookup_key`` property to determine which kind
of resource they are displaying.
They may also have a ``resource_id`` property to determine which resource they are displaying.

* Resource display
	* ``QueryWrapper``
		* A component that will wrap a query and display a loading spinner, error message, or the result of the query
	* ``ResourceList``
		* A generic list component that can be used to display a list of resources in collapsed ``ResourceCard`` components
	* ``ResourceCard``
		* A generic card component that can be used to display a resource in either collapsed (three lines) or expanded (full) form
	* ``ResourceChip``
		* A generic chip component that can be used to display a resource as a single line of text
	* ``ResourceCreator``
		* A generic creator component that can be used to create a resource
* Utilities
	* ``LoadingChip``
		* A generic loading chip component that can be used to display a loading state
	* ``CountBadge``
		* A generic badge component that can be used to display a count over an icon
	* ``LookupKeyIcon``
		* A generic icon component that can be used to display a resource's icon
	* ``CardActionBar``
		* A generic action bar component that can be used to display actions for a resource
	* ``NumberInput``
		* A generic number input component that can be used to input a number
* Data display
	* The family of components in the ``src/Components/prettify`` directory
		* These components are used to display data in a more human-readable form
		* They are interrelated and pass change events recursively up their render tree
	* ``TypeChanger``
		* A component that can be used to change the type of a data field
* Filtering
	* The components in the ``src/Components/filtering`` directory
		* These components are used to filter resources
		* Filters are instances of a family of available filters that can be applied to a resource
		* A Filter is a combination of a generic filtering function and a value to filter against
* Error handling
	* ``ErrorBoundary``
		* A component that can be used to catch errors in a component tree and display an error message
	* Components in the ``src/Components/errors`` directory display error messages in the appropriate format

Documentation
================================================================================

Documentation is written in
`Sphinx' reStructured Text <https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html>`_
and produced by `Sphinx <https://www.sphinx-doc.org/en/master/index.html>`_.

Documentation is located in the ``/docs/source`` directory.

********************************************************************************
Contributor guide
********************************************************************************

We very much welcome contributions. 
Please feel free to participate in discussion around the issues listed on GitHub,
submit new bugs or feature requests, or help contribute to the codebase.

If you are contributing to the codebase, we request that your pull requests
identify and solve a specific problem, and include unit tests for logic that
has been added or modified, along with updated documentation if relevant.

GitHub Actions
================================================================================

The project uses GitHub Actions to run tests, build the frontend and documentation,
and issue new releases.

When you push to a branch with a version number different from the current one,
the GitHub Actions workflow will check whether the version number is valid
and whether the code can be built and released.

When a tag with the format ``v[0-9]+\.[0-9]+\.[0-9]+`` (e.g. ``v1.2.3``) is pushed to the repository,
the GitHub Actions workflow will build the frontend and documentation,
and issue a new release of the frontend.

The testing workflows are always run when code is pushed to the repository.
