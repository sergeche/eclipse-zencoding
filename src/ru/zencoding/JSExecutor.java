package ru.zencoding;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

public class JSExecutor {
	private volatile static JSExecutor singleton;
	private Context cx;
	private Scriptable scope;
	private Reader fReader;
	private boolean inited = false; 
	private String fileName = "zencoding.js";

	private JSExecutor() {
		inited = false;
		cx = Context.enter();
		scope = cx.initStandardObjects();
		Reader input = getJSInput();
		if (input != null) {
			try {
				cx.evaluateReader(scope, input, getFilename(), 1, null);
				inited = true;
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
				if (singleton == null)
					singleton = new JSExecutor();
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

	
	public boolean isInited() {
		return inited;
	}
	
	/**
	 * Runs Zen Coding script on passed editor object
	 * @return 'True' if action was successfully executed
	 */
	public boolean runAction(IZenEditor editor, String actionName) {
		if (isInited()) {
			Object fnObj = scope.get("runZenCodingAction", scope);
			if (fnObj instanceof Function) {
				
				Object wrappedEditor = Context.javaToJS(editor, scope);
				
				Object fnArgs[] = {wrappedEditor, actionName};
				Function f = (Function) fnObj;
				Object result = f.call(cx, scope, scope, fnArgs);
				return Context.toBoolean(result);
			} else {
				System.err.println("Cannot get 'runZenCodingAction' function from JS");
			}
		}
		
		return false;
	}
}