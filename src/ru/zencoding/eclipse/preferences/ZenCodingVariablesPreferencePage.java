package ru.zencoding.eclipse.preferences;

import org.eclipse.ui.IWorkbenchPreferencePage;

import ru.zencoding.JSExecutor;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class ZenCodingVariablesPreferencePage extends VariablePreferencePage
		implements IWorkbenchPreferencePage {
	
	public ZenCodingVariablesPreferencePage() {
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
        setTemplateStore(TemplateHelper.getVariableStore());
        setDescription("Variables for Zen Coding");
	}
	
	@Override
	public boolean performOk() {
		JSExecutor.getSingleton().reloadUserSettings();
		return super.performOk();
	}
	
	@Override
	protected void performDefaults() {
		super.performDefaults();
		JSExecutor.getSingleton().reloadUserSettings();
	}

}
