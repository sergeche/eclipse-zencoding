package ru.zencoding.eclipse.handlers;

import org.eclipse.jface.text.Document;
import org.eclipse.ui.IEditorPart;
import org.eclipse.ui.PlatformUI;
import org.eclipse.ui.editors.text.TextEditor;
import org.eclipse.ui.texteditor.IDocumentProvider;
import org.eclipse.ui.texteditor.ITextEditor;

import ru.zencoding.JSExecutor;
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
	
	public TextEditor getActiveEditor() {
		IEditorPart editor = PlatformUI.getWorkbench().getActiveWorkbenchWindow().getActivePage().getActiveEditor();
		if (editor instanceof ITextEditor) {
			return (TextEditor) editor;
		}
		
		return null;
	}
	
	public Document getActiveDocument() {
		return getDocument(getActiveEditor());
	}
	
	public static Document getDocument(TextEditor editor) {
		if (editor != null) {
			IDocumentProvider dp = editor.getDocumentProvider();
			return (Document) dp.getDocument(editor.getEditorInput());
		}
		
		return null;
	}
	
	/**
	 * Runs Zen Coding action, automatically setting up context editor
	 * @param actionName Action name to perform
	 * @return
	 */
	public boolean run(String actionName) {
		TextEditor editor = getActiveEditor();
		if (editor != null) {
			zenEditor.setContext(editor);
			return js.runAction(zenEditor, actionName);
		}
		
		return false;
	}
}