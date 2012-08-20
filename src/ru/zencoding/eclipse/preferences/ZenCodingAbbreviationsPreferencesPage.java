package ru.zencoding.eclipse.preferences;

import org.eclipse.ui.IWorkbenchPreferencePage;
import org.eclipse.ui.texteditor.templates.TemplatePreferencePage;

import ru.zencoding.JSExecutor;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class ZenCodingAbbreviationsPreferencesPage extends TemplatePreferencePage implements
		IWorkbenchPreferencePage {
	
	public ZenCodingAbbreviationsPreferencesPage() {
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
        setTemplateStore(TemplateHelper.getTemplateStore("abbreviations"));
        setContextTypeRegistry(TemplateHelper.getContextTypeRegistry());
        setDescription("Abbreviations for Zen Coding are building blocks for XHTML tags. " +
        		"Abbreviation should look like opening XHTML tag, e.g.:\n" +
        		"<div class=\"text\">\n\n" +
        		"The forward slash at the of tag definition means that a self-closing " +
        		"form of this element is preffered, e.g.:\n" +
        		"<img src=\"myimage.png\" />");
	}

	@Override
	protected boolean isShowFormatterSetting() {
		return false;
	}

	@Override
	public boolean performOk() {
		JSExecutor.reset();
		return super.performOk();
	}
	
	@Override
	protected void performDefaults() {
		JSExecutor.reset();
		super.performDefaults();
	}
}