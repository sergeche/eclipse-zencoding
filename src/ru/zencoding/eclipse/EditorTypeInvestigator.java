package ru.zencoding.eclipse;


/**
 * Tries to investigate editor's type and syntax profile
 * @author sergey
 *
 */
public class EditorTypeInvestigator {
	private volatile static EditorTypeInvestigator singleton;
	
	public static String TYPE_HTML = "html";
	public static String TYPE_XML = "xml";
	public static String TYPE_CSS = "css";
	public static String TYPE_HAML = "haml";
	public static String TYPE_XSL = "xsl";
	
	public static String PROFILE_XML = "xml";
	public static String PROFILE_XHTML = "xhtml";
	public static String PROFILE_HTML = "html";
	
	private EditorTypeInvestigator() {
		
	}
	
	public static EditorTypeInvestigator getSingleton() {
		if (singleton == null) {
			synchronized (EditorTypeInvestigator.class) {
				if (singleton == null)
					singleton = new EditorTypeInvestigator();
			}
		}
		return singleton;
	}
	
	/**
	 * Returns current editor's syntax mode
	 */
	public String getSyntax(EclipseZenEditor editor) {
		String className = editor.getEditor().getClass().getName().toLowerCase();
		
		if (className.indexOf("xsleditor") != -1)
			return TYPE_XSL;
		else if (className.indexOf("hamleditor") != -1)
			return TYPE_HAML;
		else if (className.indexOf("sasseditor") != -1)
			return TYPE_CSS;
		else if (className.indexOf(".css.") != -1)
			return TYPE_CSS;
		else 
			return TYPE_HTML;
	}
	
	/**
	 * Returns current output profile name (@see zen_coding#setupProfile)
	 */
	public String getOutputProfile(EclipseZenEditor editor) {
		String syntax = getSyntax(editor);
		if (syntax.equals(TYPE_XML) || syntax.equals(TYPE_XSL))
			return PROFILE_XML;
		else
			// TODO more intelligent output profile guessing
			return PROFILE_XHTML;
	}
}
