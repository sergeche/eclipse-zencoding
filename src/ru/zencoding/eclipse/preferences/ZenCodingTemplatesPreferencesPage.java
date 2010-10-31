package ru.zencoding.eclipse.preferences;

import org.eclipse.ui.IWorkbenchPreferencePage;
import org.eclipse.ui.texteditor.templates.TemplatePreferencePage;

import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class ZenCodingTemplatesPreferencesPage extends TemplatePreferencePage implements
		IWorkbenchPreferencePage {
	
	public ZenCodingTemplatesPreferencesPage() {
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
        setTemplateStore(TemplateHelper.getTemplateStore());
        setContextTypeRegistry(TemplateHelper.getContextTypeRegistry());
        setDescription("Templates for Zen Coding");
	}

	@Override
	protected boolean isShowFormatterSetting() {
		return false;
	}

	@Override
	public boolean performOk() {
		// TODO Auto-generated method stub
		return super.performOk();
	}
	
	
}
