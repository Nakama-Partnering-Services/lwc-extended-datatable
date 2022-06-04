public with sharing class RelatedListConfig {
	@AuraEnabled
	public String sobjectLabel;
	@AuraEnabled
	public String sobjectLabelPlural;
	@AuraEnabled
	public String childObjectName;
	@AuraEnabled
	public String relationshipField;
	@AuraEnabled
	public String iconName;
	@AuraEnabled
	public String relatedList;

	// CONSTRUCTOR

	public RelatedListConfig(String parentId, String relatedList, String childObjectName, String relationshipField) {
		if (String.isNotBlank(relatedList)) {
			this(parentId, relatedList);
		} else {
			this(parentId, childObjectName, relationshipField);
		}
	}

	private RelatedListConfig(Id parentId, String relatedList) {
		this.relatedList = relatedList;

		Schema.DescribeSObjectResult sobjectDescribe;

		for (ChildRelationship relation : parentId.getSObjectType().getDescribe().getChildRelationships()) {
			if (relatedList == relation.getRelationshipName()) {
				sobjectDescribe = relation.getChildSObject().getDescribe();
				relationshipField = relation.getField().getDescribe().getName();
				break;
			}
		}

		sobjectLabel = sobjectDescribe.getLabel();
		sobjectLabelPlural = sobjectDescribe.getLabelPlural();

		childObjectName = sobjectDescribe.getLocalName();

		iconName = getIconName();
	}

	private RelatedListConfig(Id parentId, String childObjectName, String relationshipField) {
		this.childObjectName = childObjectName;
		this.relationshipField = relationshipField;

		Schema.DescribeSObjectResult sobjectDescribe = getSObjectDescribe(childObjectName);

		sobjectLabel = sobjectDescribe.getLabel();
		sobjectLabelPlural = sobjectDescribe.getLabelPlural();

		iconName = getIconName();
		relatedList = getRelatedList(parentId);
	}

	// PRIVATE

	// Note: this approach has a better performance than GlobalDescribe or DescribeSobjects
	private Schema.DescribeSObjectResult getSObjectDescribe(String objectApiName) {
		return ((SObject) Type.forName(objectApiName).newInstance()).getSObjectType().getDescribe();
	}

	private String getIconName() {
		List<Schema.DescribeTabSetResult> tabSets = Schema.DescribeTabs();
		List<Schema.DescribeTabResult> tabs = new List<Schema.DescribeTabResult>();
		List<Schema.DescribeIconResult> icons = new List<Schema.DescribeIconResult>();

		for (Schema.DescribeTabSetResult tabSet : tabSets) {
			tabs.addAll(tabSet.getTabs());
		}

		String iconName;

		for (Schema.DescribeTabResult tab : tabs) {
			String tabObjName = tab.getSobjectName();
			Boolean matchTabObjName = childObjectName == tabObjName;
			if (matchTabObjName) {
				if (tab.isCustom()) {
					icons.addAll(tab.getIcons());
				} else {
					iconName = 'standard:' + childObjectName.toLowerCase();
				}
			}
		}

		for (Schema.DescribeIconResult icon : icons) {
			if (icon.getContentType() == 'image/svg+xml') {
				iconName = 'custom:' + icon.getUrl().substringBetween('custom/', '.svg').substringBefore('_');
				break;
			}
		}

		return iconName;
	}

	/**
	 * Returns the name of the relationship for the the child list, for example: 'Contacts' in Account.
	 */
	private String getRelatedList(Id parentId) {
		Schema.DescribeSObjectResult parentDescribe = parentId.getSObjectType().getDescribe();

		if (String.isBlank(relationshipField)) {
			relationshipField = getDefaultRelationshipField(parentDescribe.getName());
		}

		String relatedList;

		for (Schema.ChildRelationship childRelation : parentDescribe.getChildRelationships()) {
			String childName = childRelation.getChildSObject().getDescribe().getName();
			Boolean matchObject = childName == childObjectName;
			String fieldRelation = childRelation.getField().getDescribe().getName();
			Boolean matchRelation = fieldRelation == relationshipField;

			if (matchObject && matchRelation) {
				relatedList = childRelation.getRelationshipName();
				break;
			}
		}

		return relatedList;
	}

	private String getDefaultRelationshipField(String parentObject) {
		List<SObjectField> sObjectFields = getSObjectDescribe(childObjectName).fields.getMap().values();

		for (SObjectField field : sObjectFields) {
			DescribeFieldResult fieldDescribe = field.getDescribe();
			String fieldType = fieldDescribe.getType().name();

			Boolean matchReference =
				fieldType == Schema.DisplayType.Reference.name() &&
				parentObject == fieldDescribe.getReferenceTo()[0].getDescribe().getName();

			if (matchReference) {
				return fieldDescribe.getName();
			}
		}

		throw new InvalidRelationshipException(Label.Invalid_Relationship_Error);
	}

	// INNER

	private class InvalidRelationshipException extends Exception {
	}
}
