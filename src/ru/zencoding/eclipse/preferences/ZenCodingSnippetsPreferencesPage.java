package ru.zencoding.eclipse.preferences;

import org.eclipse.ui.IWorkbenchPreferencePage;
import org.eclipse.ui.texteditor.templates.TemplatePreferencePage;

import ru.zencoding.JSExecutor;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class ZenCodingSnippetsPreferencesPage extends TemplatePreferencePage
		implements IWorkbenchPreferencePage {
	
	public ZenCodingSnippetsPreferencesPage() {
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
        setTemplateStore(TemplateHelper.getTemplateStore("snippets"));
        setContextTypeRegistry(TemplateHelper.getContextTypeRegistry());
        setDescription("Snippets for Zen Coding are used for describing arbitrary code blocks.");
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
