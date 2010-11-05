package ru.zencoding.eclipse.handlers;

import org.eclipse.ui.IEditorPart;

import ru.zencoding.JSExecutor;
import ru.zencoding.eclipse.EclipseZenCodingHelper;
import ru.zencoding.eclipse.EclipseZenEditor;

public class ActionRunner {
	private volatile static ActionRunner singleton;
	private EclipseZenEditor zenEditor;
	private JSExecutor js;

	private ActionRunner() {
		zenEditor = new EclipseZenEditor();
		js = JSExecutor.getSingleton();
	}

	public static ActionRunner getSingleton() {
		if (singleton == null) {
			synchronized (ActionRunner.class) {
				if (singleton == null)
					singleton = new ActionRunner();
			}
		}
		return singleton;
	}
	
	
	
	/**
	 * Runs Zen Coding action, automatically setting up context editor
	 * @param actionName Action name to perform
	 * @return
	 */
	public boolean run(String actionName) {
		EclipseZenEditor editor = getEditor();
		if (editor != null) {
			try {
				return js.runAction(editor, actionName);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return false;
	}
	
	public EclipseZenEditor getEditor() {
		IEditorPart editor = EclipseZenCodingHelper.getActiveEditor();
		if (editor != null) {
			zenEditor.setContext(editor);
			return zenEditor;
		}
		
		return null;
	}
}