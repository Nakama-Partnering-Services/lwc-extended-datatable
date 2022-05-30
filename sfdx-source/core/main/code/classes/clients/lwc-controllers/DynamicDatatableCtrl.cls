public with sharing class DynamicDatatableCtrl {
	// PUBLIC

	@AuraEnabled(cacheable=true)
	public static List<ColumnConfig> fetchColumnsConfig(DynamicDatatableColumnsConfiguration columnsConfiguration) {
		try {
			return columnsConfiguration.getColumnsConfig();
		} catch (Exception e) {
			throw new ApplicationException().auraHandled(e); // TODO: Is this really needed? it masks real error stack trace
		}
	}

	@AuraEnabled
	public static String fetchData(
		DynamicDatatableQueryConfiguration queryConfig,
		String nestingRelationshipField,
		Integer maxDepth
	) {
		try {
			Object result;
			if (nestingRelationshipField != null) {
				result = TreeGridDataAdapter.getRecords(
					queryConfig.getFormattedQuery(),
					nestingRelationshipField,
					maxDepth
				);
			} else {
				result = Database.query(queryConfig.getFormattedQuery());
			}
			return JSON.serialize(result);
		} catch (AuraHandledException e) {
			throw e;
		} catch (Exception e) {
			throw new ApplicationException().auraHandled(e);
		}
	}

	@AuraEnabled
	public static void updateRecords(List<SObject> records) {
		try {
			// FALSE POSITIVE: OLS and FLS checks are already performed by the LWC where this method is being used
			update records;
		} catch (Exception e) {
			throw new ApplicationException().auraHandled(e);
		}
	}
}
