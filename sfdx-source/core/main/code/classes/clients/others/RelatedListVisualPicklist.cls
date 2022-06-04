@SuppressWarnings('PMD.AvoidGlobalModifier')
global with sharing class RelatedListVisualPicklist extends VisualEditor.DynamicPickList {
	private VisualEditor.DynamicPickListRows rows;

	// CONSTRUCTORS

	@TestVisible
	private RelatedListVisualPicklist(String pageType, String objectType) {
		if (pageType == 'RecordPage') {
			rows = new VisualEditor.DynamicPickListRows();
			for (ChildRelationship relation : childRelationships(objectType)) {
				String relationshipName = relation.getRelationshipName();
				if (String.isNotBlank(relationshipName)) {
					rows.addRow(new VisualEditor.DataRow(relationshipName, relationshipName));
				}
			}
		}
	}

	global RelatedListVisualPicklist(VisualEditor.DesignTimePageContext context) {
		this(context.pageType, context.entityName);
	}

	// PUBLIC

	global override VisualEditor.DataRow getDefaultValue() {
		return null;
	}

	global override VisualEditor.DynamicPickListRows getValues() {
		return rows;
	}

	// PRIVATE

	private List<ChildRelationship> childRelationships(String parentType) {
		return fflib_SObjectDescribe.getDescribe(parentType).getDescribe().getChildRelationships();
	}
}
