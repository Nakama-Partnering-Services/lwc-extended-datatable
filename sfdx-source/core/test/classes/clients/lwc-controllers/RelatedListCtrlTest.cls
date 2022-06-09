@IsTest
class RelatedListCtrlTest {
	@IsTest
	static void completeRelatedListConfigWithObject() {
		// Setup
		final Account acc = new Account(Name = 'test');
		insert acc;
		final Contact cnt = new Contact(LastName = 'test', AccountId = acc.Id);
		insert cnt;

		RelatedListConfig config = new RelatedListConfig();
		config.recordId = acc.Id;
		config.childObjectName = 'Contact';

		// Exercise
		config = RelatedListCtrl.completeRelatedListConfig(config);

		// Verify
		System.assertEquals('Contacts', config.relatedList, 'Related list does not match');
		System.assertEquals('AccountId', config.relationshipField, 'Relationship field does not match');
		System.assertNotEquals(null, config.sobjectLabel, 'Object label should not be null');
		System.assertNotEquals(null, config.sobjectLabelPlural, 'Object plural label should not be null');
		// If Contact does not have its own tab in the org it will be null so it can not be asserted
		// System.assertNotEquals(null, config.iconName, 'Contacts icon should not be null');
	}

	@IsTest
	static void completeRelatedListConfigWithRelatedList() {
		// Setup
		final Account acc = new Account(Name = 'test');
		insert acc;
		final Contact cnt = new Contact(LastName = 'test', AccountId = acc.Id);
		insert cnt;

		RelatedListConfig config = new RelatedListConfig();
		config.recordId = acc.Id;
		config.relatedList = 'Contacts';

		// Exercise
		config = RelatedListCtrl.completeRelatedListConfig(config);

		// Verify
		System.assertEquals('Contact', config.childObjectName, 'Child object does not match');
		System.assertEquals('AccountId', config.relationshipField, 'Relationship field does not match');
		System.assertNotEquals(null, config.sobjectLabel, 'Object label should not be null');
		System.assertNotEquals(null, config.sobjectLabelPlural, 'Object plural label should not be null');
		// If Contact does not have its own tab in the org it will be null so it can not be asserted
		// System.assertNotEquals(null, config.iconName, 'Contacts icon should not be null');
	}
}
