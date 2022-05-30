@IsTest
private with sharing class TreeGridDataAdapterTest {
	@TestSetup
	private static void makeData() {
		Account acc1 = new Account(Name = 'Test1');
		insert acc1;
		Account acc2 = new Account(Name = 'Test2', ParentId = acc1.Id);
		insert acc2;
	}

	@IsTest
	private static void givenAccountWithChildWhenQueryRecursiveDataThenResultIsNested() {
		// Exercise
		List<RecordWithChildren> result = TreeGridDataAdapter.getRecords(
			'SELECT Id, ParentId, Name FROM Account',
			'ParentId',
			null
		);

		// Verify
		System.assertEquals(1, result[0].children.size(), 'Parent record should contain 1 nested child');
	}

	@IsTest
	private static void givenAccountWithChildWhenQueryWithAndWithoutLimitThenResultsAreEquals() {
		// Exercise
		String serializedResultWithoutLimit = JSON.serialize(
			TreeGridDataAdapter.getRecords('SELECT Id, ParentId, Name FROM Account', 'ParentId', null)
		);
		String serializedResultWithMaxDepth = JSON.serialize(
			TreeGridDataAdapter.getRecords('SELECT Id, ParentId, Name FROM Account', 'ParentId', 1)
		);

		// Verify
		System.assertEquals(
			serializedResultWithoutLimit,
			serializedResultWithMaxDepth,
			'Result without max depth should be equals to result with max depth 1'
		);
	}
}
