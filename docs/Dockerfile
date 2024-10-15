# Set up sphinx-autobuild for local development
# Adapted from https://www.rizzonicola.com/posts/sphinx-docker/
FROM sphinxdoc/sphinx:7.4.7
WORKDIR /etc/
RUN mkdir /source
RUN mkdir /build

RUN pip install sphinx-autobuild sphinx-rtd-theme sphinxcontrib-images

CMD ["sh", "-c", "sphinx-autobuild -b html --host 0.0.0.0 --port 8003 /source /build"]
