# Set up sphinx-autobuild for local development
# Adapted from https://www.rizzonicola.com/posts/sphinx-docker/
FROM sphinxdoc/sphinx
WORKDIR /etc/
RUN mkdir /source
RUN mkdir /build

RUN pip install sphinx-autobuild sphinx-rtd-theme

CMD sphinx-autobuild -b html --host 0.0.0.0 --port 80 /source /build
