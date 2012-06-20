package ru.zencoding;

import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.InputStream;
import java.io.InputStreamReader;

import org.eclipse.jface.preference.IPreferenceStore;
import org.eclipse.jface.text.templates.Template;
import org.eclipse.jface.text.templates.persistence.TemplateStore;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import ru.zencoding.eclipse.EclipseTemplateProcessor;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;
import ru.zencoding.eclipse.preferences.PreferenceConstants;
import ru.zencoding.eclipse.preferences.TemplateHelper;
import ru.zencoding.eclipse.preferences.output.OutputProfile;

public class JSExecutor {
	private volatile static JSExecutor singleton;
	private static Context cx;
	private static Scriptable scope;
	private static boolean inited = false; 
	private static String snippetsJSON = "snippets.json";
	
	private static String[] coreFiles = {
		"zencoding.js", 
		"file-interface.js",
		"java-wrapper.js"
	}; 
	
	protected static class NotAFunctionException extends Exception {
		private static final long serialVersionUID = -1259543361680422950L;
	}

	private JSExecutor() {
		inited = false;
		cx = Context.enter();
		scope = cx.initStandardObjects();
		try {
			// load core
			for (int i = 0; i < coreFiles.length; i++) {
				cx.evaluateReader(scope, getReaderForLocalFile(coreFiles[i]), coreFiles[i], 1, null);
			}
			
			// load snippets
			execJSFunction("javaLoadSystemSnippets", readLocalFile(snippetsJSON));
			
			loadExtensions(cx, scope);
			inited = true;
		} catch (Exception e) {
			System.err.println(e.getMessage());
		}
	}

	public static JSExecutor getSingleton() {
		if (singleton == null) {
			synchronized (JSExecutor.class) {
				if (singleton == null) {
					singleton = new JSExecutor();
					singleton.reloadUserSettings();
				}
			}
		}
		return singleton;
	}
	
	public static void reset() {
		if (singleton == null)
			return;
		
		Context.exit();
		cx = null; 
		scope = null;
		singleton = null;
	}
	
	private InputStreamReader getReaderForLocalFile(String fileName) {
		InputStream is = this.getClass().getResourceAsStream(fileName);
		return new InputStreamReader(is);
	}
	
	private String readLocalFile(String fileName) {
		// using Scanner trick:
		// http://stackoverflow.com/a/5445161/1312205
		InputStream is = this.getClass().getResourceAsStream(fileName);
		try {
	        return new java.util.Scanner(is).useDelimiter("\\A").next();
	    } catch (java.util.NoSuchElementException e) {
	        return "";
	    }
	}
	
	public boolean isInited() {
		return inited;
	}
	
	/**
	 * Executes arbitrary JS function with passed arguments. Each argument is
	 * automatically converted to JS type
	 * @param name JS function name. May have namespaces 
	 * (e.g. <code>zen_coding.require('actions').get</code>)
	 * @param vargs
	 * @return
	 */
	public Object execJSFunction(String name, Object... vargs) {
		// temporary register all variables
		Object wrappedObj;
		StringBuilder jsArgs = new StringBuilder();
		for (int i = 0; i < vargs.length; i++) {
			wrappedObj = Context.javaToJS(vargs[i], scope);
			ScriptableObject.putProperty(scope, "__javaParam" + i, wrappedObj);
			if (i > 0) {
				jsArgs.append(',');
			}
			jsArgs.append("__javaParam" + i);
		}
		
		// evaluate code
		Object result = cx.evaluateString(scope, name + "(" + jsArgs.toString() + ");", "<eval>", 1, null);
		
		// remove temp variables
		for (int i = 0; i < vargs.length; i++) {
			ScriptableObject.deleteProperty(scope, "__javaParam" + i);
		}
		
		return result;
	}
	
	/**
	 * Runs Zen Coding script on passed editor object (should be the first argument)
	 * @return 'True' if action was successfully executed
	 */
	public boolean runAction(Object... args) {
		if (isInited()) {
			return Context.toBoolean(execJSFunction("runZenCodingAction", args));
		}
		
		return false;
	}
	
	/**
	 * Reloads user-defined Zen Coding abbreviations and snippets: removes old
	 * and adds new ones
	 */
	public void reloadUserSettings() {
		if (isInited()) {
			execJSFunction("resetUserSettings");
			saveSettings("abbreviations");
			saveSettings("snippets");
			saveVariables();
		}
	}
	
	private void saveSettings(String type) {
		TemplateStore storage = TemplateHelper.getTemplateStore(type);
		Template[] templates = storage.getTemplates();
		for (Template template : templates) {
			String ctxId = template.getContextTypeId();
			String syntax = ctxId.substring(ctxId.lastIndexOf('.') + 1);
			
			execJSFunction("addUserResource", syntax, type, template.getName(),
					EclipseTemplateProcessor.process(template.getPattern()));
		}
	}
	
	private void saveVariables() {
		TemplateStore storage = TemplateHelper.getVariableStore();
		Template[] templates = storage.getTemplates();
		for (Template template : templates) {
			execJSFunction("addUserVariable", template.getName(), 
					EclipseTemplateProcessor.process(template.getPattern()));
		}
	}
	
	public void setupProfile(String name, OutputProfile profile) {
		execJSFunction("setupOutputProfile", name, profile);
	}
	
	/**
	 * Check if Zen Coding has predefined variable of that name
	 * @param name
	 * @return
	 */
	public boolean hasVariable(String name) {
		if (isInited()) {
			return Context.toBoolean(execJSFunction("hasZenCodingVariable", name));
		}
		
		return false;
	}
	
	/**
	 * Returns preview for "Wrap with Abbreviation" action
	 */
	public String getWrapPreview(IZenEditor editor, String abbr) {
		if (isInited()) {
			return Context.toString(execJSFunction("previewWrapWithAbbreviation", editor, abbr));
		}
		
		return null;
	}
	
	/**
	 * Loads Zen Coding extensions from folder
	 * @param cx
	 * @param scope
	 */
	private void loadExtensions(Context cx, Scriptable scope) {
		IPreferenceStore store = EclipseZenCodingPlugin.getDefault().getPreferenceStore();
		String extensionsPath = store.getString(PreferenceConstants.P_EXTENSIONS_PATH);
		if (extensionsPath != null && extensionsPath.length() > 0) {
			File extDir = new File(extensionsPath);
			if (extDir.exists() && extDir.isDirectory()) {
				File[] files = extDir.listFiles(new FilenameFilter() {
					@Override
					public boolean accept(File dir, String name) {
						return name.endsWith(".js");
					}
				});
				
				FileInputStream fis = null;
				for (File file : files) {
					try {
						fis = new FileInputStream(file);
						cx.evaluateReader(scope, new InputStreamReader(fis), file.getName(), 1, null);
					} catch (Exception e) {
						e.printStackTrace();
					}
				}
			}
			
		}
	}
}