@IsTest
class RelatedListCtrlTest {
	@IsTest
	static void completeRelatedListConfigWithObject() {
		// Setup
		Account acc = new Account(Name = 'test');
		insert acc;
		Contact cnt = new Contact(LastName = 'test', AccountId = acc.Id);
		insert cnt;

		// Exercise
		RelatedListConfig config = RelatedListCtrl.completeRelatedListConfig(acc.Id, null, 'Contact', null);

		// Verify
		System.assertEquals(config.relatedList, 'Contacts', 'Related list does not match');
		System.assertNotEquals(config.sobjectLabel, null, 'Object label should not be null');
		System.assertNotEquals(config.sobjectLabelPlural, null, 'Object plural label should not be null');
		// If Contact does not have its own tab in the org it will be null so it can not be asserted
		// System.assertNotEquals(config.iconName, null, 'Contacts icon should not be null');
	}

	@IsTest
	static void completeRelatedListConfigWithRelatedList() {
		// Setup
		Account acc = new Account(Name = 'test');
		insert acc;
		Contact cnt = new Contact(LastName = 'test', AccountId = acc.Id);
		insert cnt;

		// Exercise
		RelatedListConfig config = RelatedListCtrl.completeRelatedListConfig(acc.Id, 'Contacts', null, null);

		// Verify
		System.assertEquals(config.childObjectName, 'Contact', 'Child object does not match');
		System.assertEquals(config.relationshipField, 'AccountId', 'Relationship field does not match');
		System.assertNotEquals(config.sobjectLabel, null, 'Object label should not be null');
		System.assertNotEquals(config.sobjectLabelPlural, null, 'Object plural label should not be null');
		// If Contact does not have its own tab in the org it will be null so it can not be asserted
		// System.assertNotEquals(config.iconName, null, 'Contacts icon should not be null');
	}
}
