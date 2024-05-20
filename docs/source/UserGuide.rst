######################################################################################
Galv User Guide
######################################################################################

Galv is a 'metadata secretary' for battery data.
It is designed to store metadata about batteries and their tests,
and to store the data itself in a way that is easy to access and analyse.

The primary packets of data in Galv are :ref:`Cycler Tests` - records of
a single run of a battery through a battery cycling machine charge and discharge schedule.
Galv packages the data from these tests alongside metadata that describes the battery,
the test, and the equipment used to conduct it.

Dashboard
==================================================================================

The dashboard is the homepage of the web frontend.
The dashboard shows the overall state of the :ref:`Files` that have been harvested,
and the status of the resources that you are able to edit.

Resources are checked against :ref:`Validation Schemas` to ensure that they are
correctly formatted and contain all the necessary information.
Any resources that fail validation will be shown on the dashboard,
where you can inspect the errors and correct them.

Data and harvesting
==================================================================================

Data enters the Galv system via a process called harvesting.
This is the process of taking raw data files and turning them into
datasets that can be accessed and analysed.

Harvesters
-------------------------------------------------------------------------------

Harvesting is done by a program called a Harvester.
Each Harvester is a standalone program that monitors directories for new datafiles.
Harvesters will be managed by someone in your :ref:`Lab <Labs>`.

At a glance, the harvesters page will show you the status of each harvester,
and you will be able to edit the name, sleep time, and active status of each harvester.
Setting a harvester's sleep time determines how long the harvester will wait between
checking for new files in its monitored paths.
Note that many data files take a long time to parse, so while there are lots of
files to parse, sleep time will have little effect on how much work the harvester program does.

Setting a harvester to inactive will stop it from checking for new files in its monitored paths.
The harvester will still check in with the Galv server at the beginning of each cycle,
to see if it has been reactivated.

Paths
-------------------------------------------------------------------------------

Paths (also called "monitored paths") are directories that the Harvester watches for new files.
The directories are always specified relative to the root of the Harvester's filesystem.
Paths belong to a :ref:`Team <Teams>` and any files that are imported from a path
will be viewable by that team.

Each path has a regular expression that is used to match files in the directory.
The expression is applied to the filename after the path itself.
If your path is ``/data`` and your regular expression is ``^[a-z]+\.csv$``,
then the Harvester will match files like ``/data/abc.csv`` and ``/data/def.csv``.
This can be used to group files with particular extensions, with a particular format to their names,
or to identify subdirectories (although the subdirectories could be added as separate paths).

Paths may only be edited or deleted by :ref:`Team <Teams>` administrators,
because otherwise the harvester could be instructed to import arbitrary files
from the filesystem.

Paths have a "stable time" that determines how long a file must be stable before
the harvester will attempt to import it.
They also have an "active" status that
determines whether the harvester will attempt to import files from that path.
Setting a path to inactive will stop the harvester from attempting to import files
from that path, but it will still check at the beginning of each cycle to see
if the path has been reactivated.

Files
-------------------------------------------------------------------------------

When a file is found in a :ref:`Path <Paths>`, the harvester will report its size to the Galv server.
If the file size has been stable for long enough, the harvester will attempt to import the dataset.
If the file is suitable for parsing, its metadata will be sent to the Galv server
and a Dataset will be constructed to house the data.

You can view files and the data that has been imported from them on the Files page.

***Note**: Files are dataset files, whereas :ref:`Attachments` are non-dataset files.*

Resources
==================================================================================

Galv links resources together in logical ways.
Resources are descriptions of things that are used in the battery testing process,
such as :ref:`Cells`, :ref:`Equipment`, and :ref:`Schedules`.
For ease of use, these three resources are grouped into :ref:`Families`.
Other resources, such as :ref:`Cycler Tests` and :ref:`Experiments`,
group resources and data together into coherent packages.

Resources can have custom properties added to them, and can be linked to other resources.
To link another resource, add a custom property and set its type to the appropriate resource type.
You should then be able to select the resource from a dropdown list, or paste its URL into the field.

Cells
-------------------------------------------------------------------------------

Cells are electrochemical cells or batteries of the same.
A cell is a single instance of a cell family, representing a specific individual physical object,
and is uniquely identified by a serial number.

Cell families are groups of cells that are of the same type.
They are used to store information about the type of cell, such as its manufacturer,
form factor, chemistry, and capacity and weight statistics.

Equipment
-------------------------------------------------------------------------------

Equipment is any piece of equipment that is used in the battery testing process.
This could be a battery cycler, a temperature chamber, or a piece of measurement equipment.

A piece of equipment is a single instance of an equipment family, representing a specific individual physical object,
and is uniquely identified by a serial number, and may have additional information such as a calibration date.

Equipment families are groups of equipment that are of the same type.
They are used to store information about the type of equipment, such as its manufacturer and type.

Schedules
-------------------------------------------------------------------------------

Schedules are the charge and discharge schedules that are used to test batteries.
Schedule families are templates for schedules that will contain the same steps and the same step types.
Specific values in those steps may be assigned to variables, which can be overridden in a schedule instance.
Variable values can be further overridden by a variable on a particular :ref:`Cell family or Cell <Cells>`.

The exact values of a schedule only become known when it is used in a :ref:`Cycler Test`,
when the final 'rendered schedule' will be produced.

Attachments
==================================================================================

Attachments are files that are not datasets.
They are used to store files that are not datasets, such as images, PDFs, or other documents.
Attachments can be linked to other resources, and are useful for storing additional information
that you have not yet broken down in a machine-readable way.

Users, Teams, and Labs
==================================================================================

Access to the Galv system is controlled by User accounts, which are grouped into Teams.
Teams are grouped into Labs.

All resources in Galv are owned by a Team, except for Harvesters, which are owned by a Lab.

A User can be a member of multiple Teams.
Teams are created by a Lab administrator, and users can be added to Teams by a Lab administrator or a Team administrator.

A Lab administrator can be appointed by the Galv server administrator or other Lab administrators.

Sharing
==================================================================================

Resources are available to users based on their access settings.
The available access settings are:

* **Anonymous**: The resource is available to everyone.
* **Authorized**: The resource is available to all users who are members of any Lab.
* **Lab member**: The resource is available to all users who are members of the Lab the resource's Team belongs to.
* **Team member**: The resource is available to all users who are members of the resource's Team.
* **Team admin**: The resource is only available to administrators of the resource's Team.

The access settings are set by the resource's owner, and can be changed at any time.
Editing a resource, including changing its access settings, is also controlled by access settings.
The most permissive setting for editing resources is "Authorized".

Permission to edit :ref:`Paths` is controlled by the access settings.
The most permissive setting for editing paths is "Team member".
This is because paths govern which files are imported by the :ref:`Harvester <harvesters>`,
and so editing paths could provide read access to any files the Harvester can access.

Permission to delete a resource is also controlled by access settings.
The most permissive setting for deleting resources is "Team member".

Programmatic access (API)
==================================================================================

Sample scripts for access data resources via Python, Julia, and Matlab are
available from the ref:`Files` page.

The API is a REST API, and its OpenAPI spec can be downloaded from the
``/spec/`` endpoint of the Galv server.
The API provides a browsable interface at ``/spec/swagger-ui/``.

This spec can be used to generate client libraries for other languages,
using tools like `OpenAPI Generator <https://openapi-generator.tech/>`_.

Python and TypeScript (Axios) clients are available for download from the
``pip`` and ``npm`` package managers, respectively, as ``galv``:

.. code-block:: bash

  pip install galv

.. code-block:: bash

  npm install @battery-intelligence-lab/galv
