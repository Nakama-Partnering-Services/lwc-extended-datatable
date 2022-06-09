@IsTest
class DynamicDatatableCtrlTest {
	@IsTest
	static void getTableInfo() {
		// Setup
		final Account acc = new Account(Name = 'test');
		insert acc;
		final Contact cnt = new Contact(FirstName = 'test', LastName = 'test', AccountId = acc.Id);
		insert cnt;

		final String pageType = 'RecordPage';
		final String objectName = 'Account';
		final String childObjectName = 'Contact';
		final String relatedList = 'Contacts';
		final String desiredFieldSet = 'Related_List_Columns';

		final Set<String> availableRelatedLists = new Set<String>();
		final RelatedListVisualPicklist picklistHandler = new RelatedListVisualPicklist(pageType, objectName);

		System.assertEquals(null, picklistHandler.getDefaultValue(), 'There should not be a default value');

		final VisualEditor.DynamicPickListRows relatedLists = picklistHandler.getValues();
		final List<VisualEditor.DataRow> rows = relatedLists.getDataRows();

		for (VisualEditor.DataRow row : rows) {
			availableRelatedLists.add(String.valueOf(row.getValue()));
		}

		System.assert(availableRelatedLists.contains(relatedList), 'Contact should be available');

		final DynamicDatatableColumnsConfiguration columnsConfiguration = new DynamicDatatableColumnsConfiguration();
		columnsConfiguration.objectApiName = childObjectName;
		columnsConfiguration.fieldSetName = desiredFieldSet;
		columnsConfiguration.hideDefaultColumnsActions = true;
		columnsConfiguration.sortable = true;
		columnsConfiguration.editable = true;
		columnsConfiguration.searchable = true;

		final DynamicDatatableQueryConfiguration queryConfig = new DynamicDatatableQueryConfiguration();
		queryConfig.selectFieldSet = desiredFieldSet;
		queryConfig.fromObject = childObjectName;
		queryConfig.relationshipField = 'AccountId';
		queryConfig.parentId = acc.Id;
		queryConfig.orderBy = 'Name';
		queryConfig.recordsLimit = 20;
		queryConfig.recordsOffset = 0;

		// Exercise
		Test.startTest();

		final List<ColumnConfig> columnsConfig = DynamicDatatableCtrl.fetchColumnsConfig(columnsConfiguration);

		final List<SObject> data = (List<SObject>) JSON.deserialize(
			DynamicDatatableCtrl.fetchData(queryConfig, null),
			List<SObject>.class
		);

		// If relationshipField is not provided, it tries to find the default
		queryConfig.relationshipField = null;
		final List<SObject> data2 = (List<SObject>) JSON.deserialize(
			DynamicDatatableCtrl.fetchData(queryConfig, null),
			List<SObject>.class
		);

		Test.stopTest();

		// Verify
		System.assertEquals(
			6,
			columnsConfig.size(),
			'columnsConfig size should match the number of fields in the field set'
		);

		System.assertEquals(1, data.size(), 'There should be 1 contact related to the account');
		System.assertEquals('test', data[0].get('FirstName'), 'Record FirstName should match');

		System.assertEquals(1, data2.size(), 'There should be 1 contact related to the account');
		System.assertEquals('test', data2[0].get('FirstName'), 'Record FirstName should match');
	}

	@IsTest
	static void fetchDataException() {
		// Setup
		final Account acc = new Account(Name = 'test');
		insert acc;

		final String childObjectName = 'Contact';
		final String desiredFieldSet = 'Related_List_Columns';

		final DynamicDatatableQueryConfiguration queryConfig = new DynamicDatatableQueryConfiguration();
		queryConfig.selectFieldSet = desiredFieldSet;
		queryConfig.fromObject = childObjectName;
		queryConfig.relationshipField = 'AccountId';
		queryConfig.parentId = acc.Id;
		queryConfig.orderBy = 'Name';
		queryConfig.recordsLimit = 20;
		queryConfig.recordsOffset = 0;

		// Exercise
		final String ex;
		try {
			queryConfig.fromObject = 'Acc';
			DynamicDatatableCtrl.fetchData(queryConfig, null);
			System.assert(false, 'fetchData should have thrown an exception due to invalid object api name');
		} catch (Exception e) {
			ex = e.getMessage();
		}

		// Verify
		System.assert(
			String.isNotBlank(ex),
			'fetchData should have thrown an exception due to invalid object api name'
		);
	}

	@IsTest
	static void updateRecords() {
		// Setup
		final Account acc = new Account(Name = 'test1');
		insert acc;

		// Exercise
		acc.Name = 'test2';
		DynamicDatatableCtrl.updateRecords(new List<SObject>{ acc });

		// Verify
		System.assertEquals(
			'test2',
			[SELECT Name FROM Account WHERE Id = :acc.Id]
			.Name,
			'Account name should have been updated'
		);
	}
}
