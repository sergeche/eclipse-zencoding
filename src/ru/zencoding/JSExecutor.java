package ru.zencoding;

import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import org.eclipse.jface.preference.IPreferenceStore;
import org.eclipse.jface.text.templates.Template;
import org.eclipse.jface.text.templates.persistence.TemplateStore;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import ru.zencoding.eclipse.EclipseTemplateProcessor;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;
import ru.zencoding.eclipse.EclipseZenFile;
import ru.zencoding.eclipse.preferences.PreferenceConstants;
import ru.zencoding.eclipse.preferences.TemplateHelper;
import ru.zencoding.eclipse.preferences.output.OutputProfile;

public class JSExecutor {
	private volatile static JSExecutor singleton;
	private static Context cx;
	private static Scriptable scope;
	private static boolean inited = false; 
	private static String fileName = "zencoding.js";
	
	private Function runActionFn;
	private Function resetVarsFn;
	private Function addResourceFn;
	private Function hasVariableFn;
	private Function setupProfileFn;
	private Function addVariableFn;
	private Function previewWrapFn;
	
	protected static class NotAFunctionException extends Exception {
		private static final long serialVersionUID = -1259543361680422950L;
	}

	private JSExecutor() {
		inited = false;
		cx = Context.enter();
		scope = cx.initStandardObjects();
		Reader input = getJSInput();
		if (input != null) {
			try {
				cx.evaluateReader(scope, input, getFilename(), 1, null);
				Object zenFile = Context.javaToJS(new EclipseZenFile(), scope);
				ScriptableObject.putProperty(scope, "zen_file", zenFile);
				loadExtensions(cx, scope);
				inited = cacheRefs();
			} catch (Exception e) {
				System.err.println(e.getMessage());
			}
		} else {
			System.err.println("Can't get reader");
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
	
	private String getFilename() {
		return fileName;
	}
	
	private Reader getJSInput() {
		InputStream is = this.getClass().getResourceAsStream(this.getFilename());
		return new InputStreamReader(is);
	}
	
	/**
	 * Caches references to JavaScript functions
	 * @return
	 * @throws NotAFunctionException 
	 */
	private boolean cacheRefs() throws NotAFunctionException {
		runActionFn = getFunction("runZenCodingAction");
		resetVarsFn = getFunction("resetUserSettings");
		addResourceFn = getFunction("addUserResource");
		hasVariableFn = getFunction("hasZenCodingVariable");
		setupProfileFn = getFunction("setupOutputProfile");
		addVariableFn = getFunction("addUserVariable");
		previewWrapFn = getFunction("previewWrapWithAbbreviation");
		
		return true;
	}
	
	private Function getFunction(String name) throws NotAFunctionException {
		Object fnObj = scope.get(name, scope);
		if (fnObj instanceof Function) 
			return (Function) fnObj;
		else 
			throw new NotAFunctionException();
	}
	

	
	public boolean isInited() {
		return inited;
	}
	
	/**
	 * Runs Zen Coding script on passed editor object
	 * @return 'True' if action was successfully executed
	 */
	public boolean runAction(IZenEditor editor, String actionName) {
		return runAction(editor, new Object[] {actionName});
	}
	
	/**
	 * Runs Zen Coding script on passed editor object
	 * @return 'True' if action was successfully executed
	 */
	public boolean runAction(IZenEditor editor, Object[] args) {
		if (isInited()) {
			Object fnArgs[] = new Object[args.length + 1];
			fnArgs[0] = convertJavaToJs(editor);
			
			for (int i = 0; i < args.length; i++) {
				fnArgs[i + 1] = args[i];
			}
			
			Object result = runActionFn.call(cx, scope, scope, fnArgs);
			return Context.toBoolean(result);
		}
		
		return false;
	}
	
	public Object convertJavaToJs(Object arg) {
		return Context.javaToJS(arg, scope);
	}
	
	/**
	 * Reloads user-defined Zen Coding abbreviations and snippets: removes old
	 * and adds new ones
	 */
	public void reloadUserSettings() {
		if (isInited()) {
			resetVarsFn.call(cx, scope, scope, null);
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
			Object fnArgs[] = {syntax, type, template.getName(),
					EclipseTemplateProcessor.process(template.getPattern())};
			addResourceFn.call(cx, scope, scope, fnArgs);
		}
	}
	
	private void saveVariables() {
		TemplateStore storage = TemplateHelper.getVariableStore();
		Template[] templates = storage.getTemplates();
		for (Template template : templates) {
			Object fnArgs[] = {template.getName(), EclipseTemplateProcessor.process(template.getPattern())};
			addVariableFn.call(cx, scope, scope, fnArgs);
		}
	}
	
	public void setupProfile(String name, OutputProfile profile) {
		setupProfileFn.call(cx, scope, scope, new Object[] {name, convertJavaToJs(profile)});
	}
	
	/**
	 * Check if Zen Coding has predefined variable of that name
	 * @param name
	 * @return
	 */
	public boolean hasVariable(String name) {
		if (isInited()) {
			Object fnArgs[] = {name};
			Object result = hasVariableFn.call(cx, scope, scope, fnArgs);
			return Context.toBoolean(result);
		} else {
			return false;
		}
	}
	
	/**
	 * Returns preview for "Wrap with Abbreviation" action
	 */
	public String getWrapPreview(IZenEditor editor, String abbr) {
		if (isInited()) {
			Object result = previewWrapFn.call(cx, scope, scope, 
					new Object[]{convertJavaToJs(editor), abbr});
			return Context.toString(result);
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