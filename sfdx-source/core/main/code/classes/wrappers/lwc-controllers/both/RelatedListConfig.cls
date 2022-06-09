public with sharing class RelatedListConfig {
	@AuraEnabled
	public String sobjectLabel;
	@AuraEnabled
	public String sobjectLabelPlural;
	@AuraEnabled
	public String iconName;

	@AuraEnabled
	public String recordId { get; set; }
	@AuraEnabled
	public String relatedList { get; set; }
	@AuraEnabled
	public String childObjectName { get; set; }
	@AuraEnabled
	public String relationshipField { get; set; }

	// PUBLIC

	public RelatedListConfig completeAllAttributes() {
		if (String.isNotBlank(relatedList)) {
			completeAllAttributes(recordId, relatedList);
		} else {
			completeAllAttributes(recordId, childObjectName, relationshipField);
		}
		return this;
	}

	// PRIVATE

	// Note: this is wrongly reported since fflib_SObjectDescribe does not support SObjectDescribeOptions
	@SuppressWarnings('PMD.EagerlyLoadedDescribeSObjectResult')
	private void completeAllAttributes(Id recordId, String relatedList) {
		final Schema.DescribeSObjectResult sobjectDescribe;

		for (
			ChildRelationship relation : fflib_SObjectDescribe.getDescribe(recordId.getSObjectType())
				.getDescribe()
				.getChildRelationships()
		) {
			if (relatedList == relation.getRelationshipName()) {
				sobjectDescribe = fflib_SObjectDescribe.getDescribe(relation.getChildSObject()).getDescribe();
				relationshipField = relation.getField().getDescribe().getLocalName();
				break;
			}
		}

		childObjectName = sobjectDescribe.getLocalName();
		sobjectLabel = sobjectDescribe.getLabel();
		sobjectLabelPlural = sobjectDescribe.getLabelPlural();

		iconName = getIconName();
		this.relatedList = relatedList;
	}

	// Note: this is wrongly reported since fflib_SObjectDescribe does not support SObjectDescribeOptions
	@SuppressWarnings('PMD.EagerlyLoadedDescribeSObjectResult')
	private void completeAllAttributes(Id recordId, String childObjectName, String relationshipField) {
		final Schema.DescribeSObjectResult sobjectDescribe = fflib_SObjectDescribe.getDescribe(childObjectName)
			.getDescribe();

		this.relationshipField = relationshipField;
		this.childObjectName = childObjectName;

		sobjectLabel = sobjectDescribe.getLabel();
		sobjectLabelPlural = sobjectDescribe.getLabelPlural();
		iconName = getIconName();
		relatedList = getRelatedList(recordId);
	}

	private String getIconName() {
		final List<Schema.DescribeTabSetResult> tabSets = Schema.DescribeTabs();
		final List<Schema.DescribeTabResult> tabs = new List<Schema.DescribeTabResult>();
		final List<Schema.DescribeIconResult> icons = new List<Schema.DescribeIconResult>();

		for (Schema.DescribeTabSetResult tabSet : tabSets) {
			tabs.addAll(tabSet.getTabs());
		}

		final String result;

		for (Schema.DescribeTabResult tab : tabs) {
			final String tabObjName = tab.getSobjectName();
			final Boolean matchTabObjName = childObjectName == tabObjName;
			if (matchTabObjName) {
				if (tab.isCustom()) {
					icons.addAll(tab.getIcons());
				} else {
					result = 'standard:' + childObjectName.toLowerCase();
					break;
				}
			}
		}

		for (Schema.DescribeIconResult icon : icons) {
			if (icon.getContentType() == 'image/svg+xml') {
				result = 'custom:' + icon.getUrl().substringBetween('custom/', '.svg').substringBefore('_');
				break;
			}
		}

		return result;
	}

	/**
	 * Returns the name of the relationship for the the child list, for example: 'Contacts' in Account.
	 */
	// Note: this is wrongly reported since fflib_SObjectDescribe does not support SObjectDescribeOptions
	@SuppressWarnings('PMD.EagerlyLoadedDescribeSObjectResult')
	private String getRelatedList(Id recordId) {
		final Schema.DescribeSObjectResult parentDescribe = fflib_SObjectDescribe.getDescribe(recordId.getSObjectType())
			.getDescribe();

		if (String.isBlank(relationshipField)) {
			relationshipField = getDefaultRelationshipField(parentDescribe);
		}

		final String result;

		for (Schema.ChildRelationship childRelation : parentDescribe.getChildRelationships()) {
			final String childName = fflib_SObjectDescribe.getDescribe(childRelation.getChildSObject())
				.getDescribe()
				.getLocalName();
			final Boolean matchObject = childName == childObjectName;
			final String fieldRelation = childRelation.getField().getDescribe().getLocalName();
			final Boolean matchRelation = fieldRelation == relationshipField;

			if (matchObject && matchRelation) {
				result = childRelation.getRelationshipName();
				break;
			}
		}

		return result;
	}

	// Note: this is wrongly reported since fflib_SObjectDescribe does not support SObjectDescribeOptions and, for fields, DEFAULT is better than FULL_DESCRIBE
	@SuppressWarnings('PMD.EagerlyLoadedDescribeSObjectResult')
	private String getDefaultRelationshipField(Schema.DescribeSObjectResult parentDescribe) {
		final List<SObjectField> sObjectFields = fflib_SObjectDescribe.getDescribe(parentDescribe)
			.getFieldsMap()
			.values();

		for (SObjectField field : sObjectFields) {
			final DescribeFieldResult fieldDescribe = field.getDescribe();
			final String fieldType = fieldDescribe.getType().name();

			final Boolean matchReference =
				fieldType == Schema.DisplayType.Reference.name() &&
				parentDescribe == fflib_SObjectDescribe.getDescribe(fieldDescribe.getReferenceTo()[0]).getDescribe();
			if (matchReference) {
				return fieldDescribe.getLocalName();
			}
		}

		throw new InvalidRelationshipException(Label.Invalid_Relationship_Error);
	}

	// INNER

	private class InvalidRelationshipException extends Exception {
	}
}
