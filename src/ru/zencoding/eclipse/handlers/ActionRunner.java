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
		IEditorPart editor = EclipseZenCodingHelper.getActiveEditor();
		if (editor != null) {
			try {
				zenEditor.setContext(editor);
				return js.runAction(zenEditor, actionName);
			} catch (Exception e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		return false;
	}
}