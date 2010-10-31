package ru.zencoding.eclipse.preferences;

import java.io.IOException;

import org.eclipse.jface.text.templates.ContextTypeRegistry;
import org.eclipse.jface.text.templates.persistence.TemplateStore;
import org.eclipse.ui.editors.text.templates.ContributionContextTypeRegistry;
import org.eclipse.ui.editors.text.templates.ContributionTemplateStore;

import ru.zencoding.eclipse.EclipseZenCodingPlugin;
import ru.zencoding.eclipse.ZenCodingContextType;

public class TemplateHelper {
	/** The template store. */
    private static TemplateStore fStore;

    /** The context type registry. */
    private static ContributionContextTypeRegistry fRegistry;

    /** Key to store custom templates. */
    public static final String CUSTOM_TEMPLATES_KEY = "ru.zencoding.eclipse.preferences.ZenCodingTemplatesPreferencesPage";

    /**
     * Returns this plug-in's template store.
     * 
     * @return the template store of this plug-in instance
     */
    public static TemplateStore getTemplateStore() {
        if (fStore == null) {
            fStore = new ContributionTemplateStore(TemplateHelper.getContextTypeRegistry(), 
                    EclipseZenCodingPlugin.getDefault().getPreferenceStore(), CUSTOM_TEMPLATES_KEY);
            try {
                fStore.load();
            } catch (IOException e) {
                e.printStackTrace();
                throw new RuntimeException(e);
            }
        }
        return fStore;
    }

    /**
     * Returns this plug-in's context type registry.
     * 
     * @return the context type registry for this plug-in instance
     */
    public static ContextTypeRegistry getContextTypeRegistry() {
        if (fRegistry == null) {
            // create an configure the contexts available in the template editor
            fRegistry = new ContributionContextTypeRegistry();
            fRegistry.addContextType(ZenCodingContextType.CTX_HTML);
            fRegistry.addContextType(ZenCodingContextType.CTX_CSS);
            
            
        }
        return fRegistry;
    }
}
