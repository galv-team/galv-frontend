######################################################################################
Tutorial: Managing Resources
######################################################################################

Resources in Galv are things that hold metadata about datasets.
They refer to things in the real world that are associated with the data.

Let's add some metadata to describe one of the experiments whose data we collected.
We'll describe the Cell, the battery cycler, and the Schedule that the data came from.
Then we'll package it into a Cycler Test to group the data and metadata together,
and finally we'll add the Cycler Test to an Experiment to show how it fits into the bigger picture.

======================================================================================
Adding a Cell
======================================================================================

Click on the 'Cells' tab in the navigation bar on the left.

Cells, like Equipment and Schedules, belong to 'families'.
Families are a way of grouping similar resources together.
You will have done your experiments on a particular physical cell,
but that cell will probably have many others that are similar to it.

Let's start by creating the family that our cell belongs to.
Click the 'Create a new Cell Family' button to create a new family.

You'll have several fields to fill in.
You can hover over a field to get more information about it,
and you can see at a glance that any field with * before it is mandatory.
If there is information that you want to associate with the family that isn't covered by the fields,
you'll be able to add it later as a 'custom property'.

Once you've filled in the fields, click the green floppy disc 'save' icon to create the family.

Now that we have a family, we can create a Cell.

Click the 'Create Cell' button to create a new Cell.

Because we supplied most of the information about the cell when we created the family,
all we need to do here is select that family, put in the cell identifier (usually a serial number),
and associate the Cell with our Team.

Once you've filled in the fields, click the green floppy disc 'save' icon to create the Cell.

======================================================================================
Custom Properties
======================================================================================

Custom properties are a way of adding extra information to a resource.

Click on the pencil icon to edit the Cell you just created.
You'll see all the information you entered when you created the Cell,
as well as all the properties that are inherited from the family.

You can change the identifier or family if you need to under 'Editable properties',
and you can add custom properties under 'Custom properties'.

Enter a name for the custom property in the '+Key' field.
You'll see a dropdown list of types you can use for the value.
By default it's set to 'string', but you can change it to a different type if you need to.
All the resource types are included, too, so you can have custom properties that are references to other resources.
Once you've selected your type, enter an appropriate value in the 'value' field,
and click the green floppy disc 'save' icon to add the custom property.

======================================================================================
Adding Equipment and Schedules
======================================================================================

You can add Equipment and Schedule resources in the same way you added the Cell.
Click on the 'Equipment' or 'Schedules' tab in the navigation bar on the left,
create a family, and then create the resource.

======================================================================================
Creating a Cycler Test
======================================================================================

A Cycler Test is a way of grouping data and metadata together.
It's a way of saying 'this data came from this experiment'.

Click on the 'Cycler Tests' tab in the navigation bar on the left.
Click on 'Create Cycler Test' to create a new Cycler Test.

Select your Cell, Equipment, and Schedule from the dropdown lists.
You can also add a File that holds the data from your test if it's been harvested.
Associate the resource with your team, and then click the green floppy disc 'save' icon to create the Cycler Test.

======================================================================================
Creating an Experiment
======================================================================================

An Experiment is a way of grouping Cycler Tests together.
It's a way of saying 'these tests were all part of the same project'.

By now the interface should be familiar to you.
You can associate yourself and other users with the Experiment by adding them as Authors.
You can select any number of Cycler Tests to associate with the Experiment.
Once you've created the Experiment, you can add any custom properties you need.

**************************************************************************************
Next steps
**************************************************************************************

Now you can upload data and create resources to describe it.
You're ready to start using Galv to manage your data and metadata.

If you would like to learn about how to automatically collect data from your battery cycler,
check out the :doc:`Configuring Harvesters <ConfiguringHarvesters>` tutorial.
