package ru.zencoding.eclipse.preferences;

import org.eclipse.ui.IWorkbenchPreferencePage;

import ru.zencoding.eclipse.EclipseZenCodingPlugin;

public class ZenCodingVariablesPreferencePage extends VariablePreferencePage
		implements IWorkbenchPreferencePage {
	
	public ZenCodingVariablesPreferencePage() {
		setPreferenceStore(EclipseZenCodingPlugin.getDefault().getPreferenceStore());
        setTemplateStore(TemplateHelper.getTemplateStore("variables"));
        setContextTypeRegistry(TemplateHelper.getVariableContextTypeRegistry());
        setDescription("Variables for Zen Coding");
	}

}
