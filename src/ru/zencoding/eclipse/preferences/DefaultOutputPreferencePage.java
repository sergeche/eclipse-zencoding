package ru.zencoding.eclipse.preferences;

import org.eclipse.jface.preference.BooleanFieldEditor;
import org.eclipse.jface.preference.FieldEditorPreferencePage;
import org.eclipse.jface.preference.IntegerFieldEditor;
import org.eclipse.jface.preference.RadioGroupFieldEditor;
import org.eclipse.jface.preference.StringFieldEditor;
import org.eclipse.ui.IWorkbench;
import org.eclipse.ui.IWorkbenchPreferencePage;

import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class DefaultOutputPreferencePage extends FieldEditorPreferencePage
		implements IWorkbenchPreferencePage {
	
	public static String prefSuffix = "default";
	
	public DefaultOutputPreferencePage() {
		super(GRID);
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
		setDescription(getPageDescription());
	}
	
	protected String getPageDescription() {
		return "A demonstration of a preference page implementation";
	}
	
	public static String getPrefName(String prefix) {
		return prefix + "_" + prefSuffix;
	}
	
	/* (non-Javadoc)
	 * @see org.eclipse.ui.IWorkbenchPreferencePage#init(org.eclipse.ui.IWorkbench)
	 */
	@Override
	public void init(IWorkbench workbench) {
	}

	@Override
	protected void createFieldEditors() {
		
		addField(new RadioGroupFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_TAG_CASE),
			"Tag case:",
			3,
			new String[][] { 
					{ "&Lowercase", "lower" }, 
					{ "&Uppercase", "upper" },
					{ "&As is", "leave" }
		}, getFieldEditorParent()));
		
		addField(new RadioGroupFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_ATTR_CASE),
				"Attribute case:",
				3,
				new String[][] { 
					{ "L&owercase", "lower" }, 
					{ "U&ppercase", "upper" },
					{ "A&s is", "leave" }
				}, getFieldEditorParent()));
		
		addField(new RadioGroupFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_ATTR_QUOTES),
				"Attribute quotes:",
				2,
				new String[][] { 
					{ "S&ingle", "single" }, 
					{ "&Double", "bouble" }
				}, getFieldEditorParent()));
		
		addField(new RadioGroupFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_TAG_NEWLINE),
				"Each tag on new line:",
				3,
				new String[][] { 
					{ "Yes", "true" }, 
					{ "No", "false" },
					{ "Decide", "decide" }
				}, getFieldEditorParent()));
		
		addField(new BooleanFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_PLACE_CURSOR),
				"Place caret placeholders in expanded abbreviations",
				getFieldEditorParent()));
		
		addField(new BooleanFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_INDENT),
				"Indent tags",
				getFieldEditorParent()));
		
		addField(new IntegerFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_INLINE_BREAK),
				"How many inline elements should be to force line break",
				getFieldEditorParent(),
				3));
		
		addField(new RadioGroupFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_SELF_CLOSING_TAG),
				"Self-closing style for writing empty elements:",
				1,
				new String[][] { 
					{ "Disabled (<br>)", "false" }, 
					{ "Enabled (<br/>)", "true" },
					{ "XHTML-style (<br />)", "xhtml" }
				}, getFieldEditorParent()));
		
		addField(
			new StringFieldEditor(getPrefName(PreferenceConstants.P_FILTERS), "Applied &filters:", getFieldEditorParent()));

	}

}
