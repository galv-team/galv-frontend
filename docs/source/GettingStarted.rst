######################################################################################
Getting started
######################################################################################

The Galv Frontend is a `React <https://reactjs.org/>`_ application.
It interfaces with an instance of the
`Backend REST API <https://Battery-Intelligence-Lab.github.io/galv-backend>`_.
If you are setting up a new instance of Galv, you will need to set up both the Frontend and the Backend.
You should set up the Backend first, as the Frontend will not work without it.

Once you have the Backend in place, you can set up the Frontend by following the instructions below.

**************************************************************************************
Deploying
**************************************************************************************

Deploying with ``fly.io``
=======================================================================================

The simplest way to deploy Galv is to use `fly.io <https://fly.io/>`_.
Fly.io is a platform that allows you to deploy Docker containers to a global network of servers.

You'll need to sign up for an account and install the fly.io CLI tool.
Next, you can create an app by opening a terminal in the root of the Galv Frontend repository and running:

.. code-block:: shell

	flyctl deploy

This will provide a walkthrough to set up the app.
You may need to do additional configuration on the fly.io website
as per the instructions provided by the fly.io CLI tool.

Once the app is created on fly.io, you can edit the ``fly.toml`` file to set
details of the deployment.

Importantly, you will need to provide the ``build.arg`` variable ``VITE_GALV_API_BASE_URL``.
This should be the fully-qualified domain name of the Galv Backend API, e.g. ``https://my-galv-backend.fly.dev``.
This is what Galv will use to make requests to the Backend.

On a related note, the Backend API needs to have the ``FRONTEND_VIRTUAL_HOST``
environment variable set to the fully-qualified domain name of the Frontend,
e.g. ``https://my-galv-frontend.fly.dev``.


Deploying with ``docker``
=======================================================================================

You can deploy Galv on your own server, or on a cloud provider such as AWS, Azure, or Google Cloud
using ``docker``.

Galv's Frontend has a ``Dockerfile`` that can be used to build a Docker image.
This builds the Frontend and serves it using `nginx <https://www.nginx.com/>`_.
Building the image requires the build argument ``VITE_GALV_API_BASE_URL`` to be set to the
fully-qualified domain name of the Galv Backend API, e.g. ``https://my-galv-backend.example.com``.

Build the image with

.. code-block:: shell

	docker build -t galv-frontend --build-arg VITE_GALV_API_BASE_URL=https://my-galv-backend.example.com .

You can then run the image with

.. code-block:: shell

	docker run -p 80:80 galv-frontend

**************************************************************************************
Setting up the Frontend
**************************************************************************************

Once the Frontend is deployed, it should be connected to the Backend and inherit all
of the configuration you've done there.
You should be able to log in with your user account and start using Galv.
