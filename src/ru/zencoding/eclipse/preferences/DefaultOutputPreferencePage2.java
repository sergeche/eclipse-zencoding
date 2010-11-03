package ru.zencoding.eclipse.preferences;

import org.eclipse.jface.preference.PreferencePage;
import org.eclipse.jface.preference.RadioGroupFieldEditor;
import org.eclipse.swt.SWT;
import org.eclipse.swt.layout.GridData;
import org.eclipse.swt.layout.GridLayout;
import org.eclipse.swt.widgets.Composite;
import org.eclipse.swt.widgets.Control;
import org.eclipse.swt.widgets.Label;
import org.eclipse.swt.widgets.List;
import org.eclipse.ui.IWorkbench;
import org.eclipse.ui.IWorkbenchPreferencePage;

public class DefaultOutputPreferencePage2 extends PreferencePage implements
		IWorkbenchPreferencePage {

	public static String prefSuffix = "default";
	
	public static String getPrefName(String prefix) {
		return prefix + "_" + prefSuffix;
	}
	
	@Override
	public void init(IWorkbench workbench) {

	}

	@Override
	protected Control createContents(Composite parent) {
		Composite top = new Composite(parent, SWT.LEFT);
		
		top.setLayoutData(new GridData(GridData.FILL_HORIZONTAL));
		
		
		
		
		GridLayout layout = new GridLayout();
		layout.numColumns = 2;
		
		top.setLayout(layout);
		
		RadioGroupFieldEditor tagCase = new RadioGroupFieldEditor(
				getPrefName(PreferenceConstants.P_PROFILE_TAG_CASE),
				"Tag case:",
				1,
				new String[][] { 
						{ "&Lowercase", "lower" }, 
						{ "&Uppercase", "upper" },
						{ "&As is", "leave" }
			}, top, true);
		
		tagCase.fillIntoGrid(top, 2);
		tagCase.setPage(this);
		tagCase.setPreferenceStore(getPreferenceStore());
		tagCase.load();
		
//		RadioGroupFieldEditor attrCase = new RadioGroupFieldEditor(
//				getPrefName(PreferenceConstants.P_PROFILE_ATTR_CASE),
//				"Attribute case:",
//				1,
//				new String[][] { 
//					{ "L&owercase", "lower" }, 
//					{ "U&ppercase", "upper" },
//					{ "A&s is", "leave" }
//				}, top, true);
//		
//		attrCase.setPage(this);
//		attrCase.setPreferenceStore(getPreferenceStore());
//		attrCase.load();
		
		
		return top;
	}

}
