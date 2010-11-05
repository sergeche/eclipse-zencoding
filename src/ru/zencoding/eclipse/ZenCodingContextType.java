package ru.zencoding.eclipse;

import org.eclipse.jface.text.templates.GlobalTemplateVariables;
import org.eclipse.jface.text.templates.TemplateContextType;

public class ZenCodingContextType extends TemplateContextType {

	/**
	 * Context type used for code-completions
	 */
	public static final String CTX_HTML = "ru.zencoding.eclipse.templates.html";

	/**
	 * Context type used for code-completions
	 */
	public static final String CTX_CSS = "ru.zencoding.eclipse.templates.css";
	
	public static final String CTX_VARIABLE = "ru.zencoding.eclipse.variable";
	
	

	public ZenCodingContextType() {
		addResolver(new GlobalTemplateVariables.Cursor());
	}
}
