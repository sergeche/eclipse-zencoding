package ru.zencoding.eclipse.preferences;

import org.eclipse.ui.IWorkbenchPreferencePage;
import org.eclipse.ui.texteditor.templates.TemplatePreferencePage;

import ru.zencoding.JSExecutor;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class ZenCodingAbbreviationsPreferencesPage extends TemplatePreferencePage implements
		IWorkbenchPreferencePage {
	
	public ZenCodingAbbreviationsPreferencesPage() {
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
        setTemplateStore(TemplateHelper.getTemplateStore());
        setContextTypeRegistry(TemplateHelper.getContextTypeRegistry());
        setDescription("Abbreviations for Zen Coding");
	}

	@Override
	protected boolean isShowFormatterSetting() {
		return false;
	}

	@Override
	public boolean performOk() {
		// TODO if JSExecutor is not created yet, don't reload settings
		JSExecutor.getSingleton().reloadUserSettings();
		return super.performOk();
	}
}