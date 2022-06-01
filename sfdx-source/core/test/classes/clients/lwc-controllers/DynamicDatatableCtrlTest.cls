@IsTest
class DynamicDatatableCtrlTest {
	@IsTest
	static void getTableInfo() {
		// Setup
		Account acc = new Account(Name = 'test');
		insert acc;
		Contact cnt = new Contact(FirstName = 'test', LastName = 'test', AccountId = acc.Id);
		insert cnt;

		String pageType = 'RecordPage';
		String objectName = 'Account';
		String childObjectName = 'Contact';
		String desiredFieldSet = 'Related_List_Columns';

		Set<String> availableChildObjects = new Set<String>();
		RelatedListVisualPicklist picklistHandler = new RelatedListVisualPicklist(pageType, objectName);
		System.assertEquals(null, picklistHandler.getDefaultValue(), 'There should not be a default value');
		VisualEditor.DynamicPickListRows relatedObjects = picklistHandler.getValues();
		List<VisualEditor.DataRow> rows = relatedObjects.getDataRows();
		for (VisualEditor.DataRow row : rows) {
			availableChildObjects.add(String.valueOf(row.getValue()));
		}
		System.assert(availableChildObjects.contains(childObjectName), 'Contact should be available');

		DynamicDatatableColumnsConfiguration columnsConfiguration = new DynamicDatatableColumnsConfiguration();
		columnsConfiguration.objectApiName = childObjectName;
		columnsConfiguration.fieldSetName = desiredFieldSet;
		columnsConfiguration.hideDefaultColumnsActions = true;
		columnsConfiguration.sortable = true;
		columnsConfiguration.editable = true;
		columnsConfiguration.searchable = true;

		DynamicDatatableQueryConfiguration queryConfig = new DynamicDatatableQueryConfiguration();
		queryConfig.selectFieldSet = desiredFieldSet;
		queryConfig.fromObject = childObjectName;
		queryConfig.relationshipField = 'AccountId';
		queryConfig.parentId = acc.Id;
		queryConfig.orderBy = 'Name';
		queryConfig.recordsLimit = 20;
		queryConfig.recordsOffset = 0;

		// Exercise
		Test.startTest();

		List<ColumnConfig> columnsConfig = DynamicDatatableCtrl.fetchColumnsConfig(columnsConfiguration);

		List<SObject> data = (List<SObject>) JSON.deserialize(
			DynamicDatatableCtrl.fetchData(queryConfig, null),
			List<SObject>.class
		);

		// If relationshipField is not provided, it tries to find the default
		queryConfig.relationshipField = null;
		List<SObject> data2 = (List<SObject>) JSON.deserialize(
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
		Account acc = new Account(Name = 'test');
		insert acc;

		String childObjectName = 'Contact';
		String desiredFieldSet = 'Related_List_Columns';

		DynamicDatatableQueryConfiguration queryConfig = new DynamicDatatableQueryConfiguration();
		queryConfig.selectFieldSet = desiredFieldSet;
		queryConfig.fromObject = childObjectName;
		queryConfig.relationshipField = 'AccountId';
		queryConfig.parentId = acc.Id;
		queryConfig.orderBy = 'Name';
		queryConfig.recordsLimit = 20;
		queryConfig.recordsOffset = 0;

		// Exercise
		String ex;
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
		Account acc = new Account(Name = 'test1');
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
