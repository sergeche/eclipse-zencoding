package ru.zencoding.eclipse;

import org.eclipse.jface.text.templates.GlobalTemplateVariables;
import org.eclipse.jface.text.templates.TemplateContextType;

public class ZenCodingContextType extends TemplateContextType {

	public static final String CTX_HTML = "ru.zencoding.eclipse.templates.html";
	public static final String CTX_CSS = "ru.zencoding.eclipse.templates.css";
	public static final String CTX_XML = "ru.zencoding.eclipse.templates.xml";
	public static final String CTX_XSL = "ru.zencoding.eclipse.templates.xsl";
	public static final String CTX_HAML = "ru.zencoding.eclipse.templates.haml";
	
	public static final String CTX_VARIABLE = "ru.zencoding.eclipse.variable";
	
	

	public ZenCodingContextType() {
		addResolver(new GlobalTemplateVariables.Cursor());
	}
}
