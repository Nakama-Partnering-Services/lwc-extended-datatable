public with sharing class RecursiveDataSelector {
	private String query;
	private String relationshipField;

	// CONSTRUCTOR

	public RecursiveDataSelector(String query, String relationshipField) {
		this.query = query;
		String namespace = fflib_SObjectDescribe.class
			.getName()
			.substringBefore('fflib_SObjectDescribe')
			.removeEnd('.')
			.toLowerCase();
		this.relationshipField = (String.isNotBlank(namespace) ? namespace + '__' : '') + relationshipField;
	}

	// PUBLIC

	public List<RecordWithChildren> queryRecursively() {
		return queryRecursively(null);
	}

	/**
	 * Note: This method has a query inside a while loop
	 * TODO: This will not work properly if data comes from related list and relationshipField for nested records
	 * is the same that for establishing the relationship of the related children records to render in the current record page
	 * TODO: This will not work properly if records have a cyclic dependency between themselves
	 * TODO: records queried recursevly need to be childs of the relationshipField main record as well. Is this desired?
	 */
	@SuppressWarnings('PMD.OperationWithLimitsInLoop')
	public List<RecordWithChildren> queryRecursively(Integer maxDepth) {
		addNullParentClause();

		List<SObject> latestRecordsRetrieved = Database.query(query);

		List<RecordWithChildren> result = new List<RecordWithChildren>();

		for (SObject record : latestRecordsRetrieved) {
			result.add(new RecordWithChildren(record));
		}

		replaceNullParentClauseByParentInLatestRecordsRetrieved();

		if (maxDepth == null) {
			maxDepth = 10;
		}

		Integer currentDepth = 0;

		while (!latestRecordsRetrieved.isEmpty() && currentDepth < maxDepth) {
			currentDepth++;
			latestRecordsRetrieved = Database.query(query);
			saveRecordsAsChildrenOfTheirParents(result, latestRecordsRetrieved);
		}

		return result;
	}

	// PRIVATE

	private void addNullParentClause() {
		if (query.containsIgnoreCase('WHERE')) {
			query = query.replaceFirst('(?i) WHERE ', ' WHERE ' + relationshipField + ' = NULL AND ');
		} else {
			List<String> queryParts = query.split(' ');
			for (Integer i = 0; i < queryParts.size(); i++) {
				if (queryParts[i] == 'FROM') {
					queryParts[i + 1] += ' WHERE ' + relationshipField + ' = NULL';
				}
			}
			query = String.join(queryParts, ' ');
		}
	}

	private void replaceNullParentClauseByParentInLatestRecordsRetrieved() {
		query = query.replace(
			' WHERE ' +
			relationshipField +
			' = NULL',
			' WHERE ' +
			relationshipField +
			' IN :latestRecordsRetrieved'
		);
	}

	private void saveRecordsAsChildrenOfTheirParents(
		List<RecordWithChildren> parentRecords,
		List<SObject> latestRecordsRetrieved
	) {
		for (RecordWithChildren recordWithChildren : parentRecords) {
			if (recordWithChildren.children != null) {
				saveRecordsAsChildrenOfTheirParents(recordWithChildren.children, latestRecordsRetrieved);
			} else {
				findChildAndAddInParent(recordWithChildren, latestRecordsRetrieved);
			}
		}
	}

	private void findChildAndAddInParent(RecordWithChildren parent, List<SObject> possibleChildren) {
		for (SObject record : possibleChildren) {
			if (parent.record.Id == record.get(relationshipField)) {
				if (parent.children == null) {
					parent.children = new List<RecordWithChildren>();
				}
				parent.children.add(new RecordWithChildren(record));
			}
		}
	}
}
