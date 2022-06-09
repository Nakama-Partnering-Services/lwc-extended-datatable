public with sharing class DynamicDatatableQueryConfiguration {
	private static final String QUERY_TEMPLATE = 'SELECT {0} FROM {1} WHERE {2} = \'\'{3}\'\' WITH SECURITY_ENFORCED ORDER BY {4} LIMIT {5} OFFSET {6}';

	@AuraEnabled
	public String selectFieldSet { get; set; }
	@AuraEnabled
	public String fromObject { get; set; }
	@AuraEnabled
	public String relationshipField {
		get {
			if (relationshipField != null) {
				relationshipField = String.escapeSingleQuotes(relationshipField);
			}
			return relationshipField;
		}
		set;
	}
	@AuraEnabled
	public Id parentId {
		get {
			if (parentId != null) {
				parentId = String.escapeSingleQuotes(parentId);
			}
			return parentId;
		}
		set;
	}
	@AuraEnabled
	public String orderBy { get; set; }
	@AuraEnabled
	public Integer recordsLimit { get; set; }
	@AuraEnabled
	public Integer recordsOffset { get; set; }
	@AuraEnabled
	public String nestingRelationshipField { get; set; }

	// PUBLIC

	public String getFormattedQuery() {
		return String.format(QUERY_TEMPLATE, getParameters());
	}

	// PRIVATE

	private List<Object> getParameters() {
		relationshipField = (String.isBlank(relationshipField)) ? getDefaultRelationshipField() : relationshipField;
		return new List<Object>{
			getSelectFields(),
			fromObject,
			relationshipField,
			parentId,
			orderBy,
			recordsLimit,
			recordsOffset
		};
	}

	private String getSelectFields() {
		final Set<String> fields = new Set<String>();

		if (String.isNotBlank(nestingRelationshipField)) {
			fields.add(nestingRelationshipField);
		}

		for (FieldSetMember field : getFieldSetFields()) {
			String fieldToAdd = field.getFieldPath();
			if (field.getType() == DisplayType.REFERENCE) {
				if (field.getFieldPath().endsWith('__c')) {
					fieldToAdd = field.getFieldPath().replace('__c', '__r.Name');
				} else if (field.getFieldPath().endsWith('Id')) {
					// Trick to no to replace other possible appearances of 'Id' in the field name
					fieldToAdd = field.getFieldPath() + '__';
					fieldToAdd = fieldToAdd.replace('Id__', '.Name');
				}
			}
			fields.add(fieldToAdd);
		}

		return String.join(new List<String>(fields), ',');
	}

	// Note: this is wrongly reported since fflib_SObjectDescribe does not support SObjectDescribeOptions
	@SuppressWarnings('PMD.EagerlyLoadedDescribeSObjectResult')
	private List<FieldSetMember> getFieldSetFields() {
		return fflib_SObjectDescribe.getDescribe(fromObject).getFieldSets().get(selectFieldSet).getFields();
	}

	// Note: this is wrongly reported since fflib_SObjectDescribe does not support SObjectDescribeOptions
	@SuppressWarnings('PMD.EagerlyLoadedDescribeSObjectResult')
	private String getDefaultRelationshipField() {
		final List<SObjectField> sObjectFields = fflib_SObjectDescribe.getDescribe(fromObject).getFieldsMap().values();
		final Schema.DescribeSObjectResult parentDescribe = fflib_SObjectDescribe.getDescribe(parentId.getSObjectType())
			.getDescribe();

		for (SObjectField field : sObjectFields) {
			final DescribeFieldResult fieldDescribe = field.getDescribe();
			final String fieldType = fieldDescribe.getType().name();
			if (fieldType == 'reference' && parentDescribe == fieldDescribe.getReferenceTo()[0].getDescribe()) {
				return fieldDescribe.getName();
			}
		}

		throw new InvalidRelationshipException(Label.Invalid_Relationship_Error);
	}

	// INNER

	private class InvalidRelationshipException extends Exception {
	}
}
