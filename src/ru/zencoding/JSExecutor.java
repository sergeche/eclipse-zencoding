package ru.zencoding;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import org.eclipse.jface.text.templates.Template;
import org.eclipse.jface.text.templates.persistence.TemplateStore;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

import ru.zencoding.eclipse.preferences.TemplateHelper;
import ru.zencoding.eclipse.preferences.output.OutputProfile;

public class JSExecutor {
	private volatile static JSExecutor singleton;
	private Context cx;
	private Scriptable scope;
	private Reader fReader;
	private boolean inited = false; 
	private String fileName = "zencoding.js";
	
	private Function runActionFn;
	private Function resetVarsFn;
	private Function addResourceFn;
	private Function hasVariableFn;
	private Function setupProfileFn;

	private JSExecutor() {
		inited = false;
		cx = Context.enter();
		scope = cx.initStandardObjects();
		Reader input = getJSInput();
		if (input != null) {
			try {
				cx.evaluateReader(scope, input, getFilename(), 1, null);
				inited = cachRefs();
			} catch (IOException e) {
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
	
	private String getFilename() {
		return fileName;
	}
	
	private Reader getJSInput() {
		if (fReader == null) {
			InputStream is = this.getClass().getResourceAsStream(this.getFilename());
			fReader = new InputStreamReader(is);
		}
		return fReader;
	}
	
	/**
	 * Caches references to JavaScript functions
	 * @return
	 */
	private boolean cachRefs() {
		Object fnObj;
		fnObj = scope.get("runZenCodingAction", scope);
		if (fnObj instanceof Function) runActionFn = (Function) fnObj;
		else return false;
		
		fnObj = scope.get("resetUserSettings", scope);
		if (fnObj instanceof Function) resetVarsFn = (Function) fnObj;
		else return false;
		
		fnObj = scope.get("addUserResource", scope);
		if (fnObj instanceof Function) addResourceFn = (Function) fnObj;
		else return false;
		
		fnObj = scope.get("hasZenCodingVariable", scope);
		if (fnObj instanceof Function) hasVariableFn = (Function) fnObj;
		else return false;
		
		fnObj = scope.get("setupOutputProfile", scope);
		if (fnObj instanceof Function) setupProfileFn = (Function) fnObj;
		else return false;
		
		return true;
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
}