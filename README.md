# Extended Datatable LWC

Custom lightning web component of a Related List with standard styling and extended functionality.

<a href="https://githubsfdeploy.herokuapp.com">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

## Introduction

If the Salesforce standard component `Related List - Single` does not match your requirements, you may find this component useful.
This component aims to allow Salesforce admins and Developers to further customize their lists and leverage the usage of additional functionalities.

## Table of contents

-   [Considerations](#considerations)
-   [Installation](#installation)
-   [Usage](#usage)
-   [Examples](#examples)
-   [Configurations](#configurations)
-   [Tests](#tests)
-   [Limitations](#limitations)
-   [Roadmap](#roadmap)
-   [Credits](#credits)
-   [Contributing](#contributing)
-   [License](#license)

## Considerations

This unlocked package is org-dependent and relies on the fflib_SObjectDescribe class, assuming that it already exists in your org or package and it is public and accessible.

## Installation

The content of this repository is available for installation as an Unlocked Package with [this link](https://login.salesforce.com/packaging/installPackage.apexp?p0=04t7Q000000co6uQAA).

## Usage

This component is available for usage in 2 different ways:

-   Declaratively from a Lightning Record Page: add the component and configure the options from the Lighting App Builder.
-   Programmatically from a parent component: add the `c-related-list` component in the markup of your parent component and provide the desired attributes as configuration. This option allows you further customization.

Besides, `c-related-list` internally uses `c-dynamic-datatable`, which is also included in this project, also available for declarative and programmatic usage. It is similar to `c-related-list` but without the standard styling and few less customizations. Consider using it when additional configurations available in `c-related-list` are not needed.

## Examples

![relatedList](./img/relatedList.PNG)

![relatedListBuilder](./img/relatedListBuilder.PNG)

https://user-images.githubusercontent.com/28541804/116081232-510e5400-a69a-11eb-84bc-a3b8f2497798.mp4

## Configurations

The component leverages the following configurations:

-   Child related list `related-list`
    -   Description: Select from a picklist the desired related list of child objects to display.
    -   Type: String
    -   Required: true
    -   Default: NA

<p>&nbsp;</p>

-   Fieldset for the column fields `fieldset`
    -   Description: Provide a fieldset on the selected object to use its fields as columns.
    -   Type: String
    -   Required: true
    -   Default: NA

<p>&nbsp;</p>

-   Api name of the relationship field in the child object referencing the parent `relationship-field`
    -   Description: Specify which relationship to use if the same object is related to the parent with more than one field.
    -   Type: String
    -   Required: false
    -   Default: NA

<p>&nbsp;</p>

-   Specifications about how to order the records displayed `order-by`
    -   Description: Customize SOQL ORDER BY clause to display the records ordered appropriately.
    -   Type: String
    -   Required: false
    -   Default: `Id ASC NULLS LAST, CreatedDate`

<p>&nbsp;</p>

-   Number of records to show `records-to-load`
    -   Description: Determine the number of records that should be displayed (same amount of records will be used in additional retrieves if "Loading more records on scroll" feature is enabled). When used as a tree grid, this value is used to retrieve children records along with top level records, so if it is small, children records may not appear.
    -   Type: Integer
    -   Required: false
    -   Default: 6

<p>&nbsp;</p>

-   Nesting relationship field `nesting-relationship-field`
    -   Description: Specify if you want the data to be nested as a tree grid. Field must be included in the fieldset. It will not work properly if the value is equals to Relationship field.
    -   Type: String
    -   Required: false
    -   Default: NA

<p>&nbsp;</p>

-   Max depth `max-depth`
    -   Description: Only applies when Is Tree Grid is true. If not specified, then 10 is applied.
    -   Type: Integer
    -   Required: false
    -   Default: NA

<p>&nbsp;</p>

-   Value for the height CSS attribute `height`
    -   Description: Determine the height for the table contained in the related list. Auto by default (mandatory to be fixed if "Loading more records on scroll" feature is enabled).
    -   Type: String
    -   Required: false
    -   Default: auto

<p>&nbsp;</p>

-   Show row numbers in the first column? `show-row-number-column`
    -   Description: Show the number of the row at the beginning.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Hide checkbox column for row selection? `hide-checkbox-column`
    -   Description: Hide the checkbox selection column at the beginning.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Disable column resizing? `resize-column-disabled`
    -   Description: Enable/Disable column resizing.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Enable infinite loading on scrolling to retrieve more records? `enable-infinite-loading`
    -   Description: Enable loading more records on scroll (requires fixed height).
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Hide default actions in column headers? `hide-default-columns-actions`
    -   Description: Hide default actions columns (wrap/clip).
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Should columns be sortable? `sortable`
    -   Description: Enable sorting. It is blocked if, in tree grid mode, there are expanded children rows.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Enable inline editing? `enable-inline-editing`
    -   Description: Enable inline editing.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Hide header? `hide-header`
    -   Description: Hide related list header.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Header icon `header-icon`
    -   Description: Icon to display in the header (if shown) next to the title (object plural label), for instance: 'standard:account'. Defaults to the icon of the tab object available for the current user, if any.
    -   Type: String
    -   Required: false
    -   Default: NA

<p>&nbsp;</p>

-   Hide new action? `hide-new-action`
    -   Description: Hide new action in header.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Display search filtering? `show-search`
    -   Description: Display search input for filtering.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Title `custom-title`
    -   Description: Title.
    -   Type: String
    -   Required: false
    -   Default: Object plural label and number of rows.

<p>&nbsp;</p>

-   Show subtitle? `show-subtitle`
    -   Description: Show subtitle in header.
    -   Type: Boolean
    -   Required: false
    -   Default: false.

<p>&nbsp;</p>

-   Subtitle `custom-subtitle`
    -   Description: Subtitle.
    -   Type: String
    -   Required: false
    -   Default: Number of items retrieved.

<p>&nbsp;</p>

-   Hide footer? `hide-footer`
    -   Description: Hide related list footer.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   Is the component directly added to the page? (check this option, if true, to apply proper styling) `is-outer-component`
    -   Description: Determines if specific styling should be applied when ths component is used inside of another.
    -   Type: Boolean
    -   Required: false
    -   Default: true from Lightning App Builder, false otherwise

<p>&nbsp;</p>

The following configurations are only available for programmatic usage:

-   `record-id`

    -   Description: Id of the parent record to retrieve childs for.
    -   Type: String
    -   Required: false
    -   Default: in a record page, this attribute is populated for Salesforce by default when used directly from the App Builder.

-   `table-info`
    -   Description: Fixed table information to display, with columns, rows, actions and implementsDragAndDrop.
    -   Type: Object
    -   Required: false
    -   Default: NA

<p>&nbsp;</p>

-   `table-info-has-editable-columns` (specify for proper styling)
    -   Description: Determines if columns of table info attribute contain editable columns.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   `actions` (ignored if table-info is provided)
    -   Description: Provide custom row actions.
    -   Type: Array of objects
    -   Required: false
    -   Default:
    ```
    [
        { label: 'View', name: 'view' },
        { label: 'Edit', name: 'edit' },
        { label: 'Delete', name: 'delete' }
    ]
    ```

<p>&nbsp;</p>

-   `implements-drag-and-drop` (ignored if table-info is provided)
    -   Description: Implement drag and drop functionality.
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   `custom-handle-new-enabled`
    -   Description: Custom handling of new action (default behavior is provided if false).
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   `custom-handle-row-action-enabled`
    -   Description: Custom handling of row actions (default behavior is provided for "View", "Edit" and "Delete" actions).
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

-   `custom-handle-save`
    -   Description: Custom handling of inline edit save (default behavior is provided if false).
    -   Type: Boolean
    -   Required: false
    -   Default: false

<p>&nbsp;</p>

## Tests

This projects leverages Apex Tests for the testing of Apex Classes. Jest Test for Lightning Web Components will be added soon.

## Limitations

-   Name fields are provided with a name, but this does not work for non-name fields like CaseNumber.
-   Header icon will not be displayed if current user does not have access to the object tab.
-   Little flaw where resizing border for the first column is overlapped.
-   Search filtering is applied over the data already loaded in the table, so rows may not appear when searching them if they have not been loaded yet. This may also happen when reloading the records to refresh the table information, for example, when saving inline editing changes.
-   Querying data recursively for nested tree grid records will not work properly if data comes from related list and nesting relationship field for nested records is the same that relationship field for establishing the relationship of the related children records to render in the current record page

## Roadmap

-   Leverage actual field labels (currently formatted API name) when using parent fields in the fieldset as columns.
-   Display actual child related list to be selected instead of child objects.
-   Implement pagination with selectable rows.

## Credits

-   **Gabriel Serrano** - Developer - [jdkgabri](https://github.com/jdkgabri)

## Contributing

Contributions are what make the trailblazer community such an amazing place. I regard this component as a way to inspire and learn from others. Any contributions you make are greatly appreciated.

See [CONTRIBUTING.md](/CONTRIBUTING.md) for contribution principles.

## License

This project is licensed under the MIT License - see the [LICENSE.md](/LICENSE.md) file for details.
