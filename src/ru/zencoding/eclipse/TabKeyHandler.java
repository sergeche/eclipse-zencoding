package ru.zencoding.eclipse;

import java.util.HashMap;

import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.ITextViewer;
import org.eclipse.jface.text.link.LinkedModeModel;
import org.eclipse.swt.custom.StyledText;
import org.eclipse.swt.custom.VerifyKeyListener;
import org.eclipse.swt.events.VerifyEvent;
import org.eclipse.ui.IPartListener;
import org.eclipse.ui.IWorkbenchPage;
import org.eclipse.ui.IWorkbenchPart;
import org.eclipse.ui.editors.text.TextEditor;

import ru.zencoding.eclipse.handlers.ActionRunner;

/**
 * Handles Tab key press
 * @author sergey
 *
 */
public class TabKeyHandler {
	private static HashMap<Integer, TextEditor> installedEditors = new HashMap<Integer, TextEditor>();
	private static HashMap<Integer, VerifyKeyListener> keyListeners = new HashMap<Integer, VerifyKeyListener>();
	private static boolean inited = false;
	
	/**
	 * Tries to install key listener on editor's widget
	 */
	public static void install(TextEditor editor) {
		Integer id = getEditorId(editor);
		if (!installedEditors.containsKey(id)) {
			// install key listener for Tab key
			try {
				ITextViewer textViewer = EclipseZenEditor.getTextViewer(editor);
				StyledText widget = textViewer.getTextWidget();
				widget.addVerifyKeyListener(getKeyListener(editor));
				installedEditors.put(id, editor);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}
	
	/**
	 * Uninstalls Tab key listener from editor
	 * @param editor
	 */
	public static void uninstall(TextEditor editor) {
		Integer id = getEditorId(editor);
		if (installedEditors.containsKey(id)) {
			try {
				StyledText widget = EclipseZenEditor.getTextViewer(editor).getTextWidget();
				widget.removeVerifyKeyListener(getKeyListener(editor));
				installedEditors.remove(id);
				keyListeners.remove(id);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
	}
	
	/**
	 * Returns unique editor ID
	 * @param editor
	 * @return
	 */
	public static Integer getEditorId(TextEditor editor) {
		return editor.hashCode();
	}
	
	public static VerifyKeyListener getKeyListener(final TextEditor editor) {
		Integer id = getEditorId(editor);
		if (!keyListeners.containsKey(id)) {
			keyListeners.put(id, new VerifyKeyListener() {
				
				@Override
				public void verifyKey(VerifyEvent event) {
					Document document = ActionRunner.getDocument(editor);
					if (document == null) {
						return;
					}
					
					if (LinkedModeModel.hasInstalledModel(document)) {
						return;
					}
					
					if (event.doit && event.keyCode == 9 
							&& ActionRunner.getSingleton().run("expand_abbreviation")) {
						event.doit = false; // cancel the event
					}
				}
			});
		}
		
		return keyListeners.get(id);
	}
	
	/**
	 * Setup global editor listener which adds Tab key listeners to newly 
	 * created editors
	 */
	public static void setup(IWorkbenchPage page) {
		if (!inited) {
			inited = true;
			page.addPartListener(new IPartListener() {
				
				@Override
				public void partOpened(IWorkbenchPart part) {
					if (part instanceof TextEditor) {
						install((TextEditor) part);
					}
				}
				
				@Override
				public void partDeactivated(IWorkbenchPart part) {
					
				}
				
				@Override
				public void partClosed(IWorkbenchPart part) {
					if (part instanceof TextEditor) {
						uninstall((TextEditor) part);
					}
				}
				
				@Override
				public void partBroughtToTop(IWorkbenchPart part) {
					
				}
				
				@Override
				public void partActivated(IWorkbenchPart part) {
					if (part instanceof TextEditor) {
						install((TextEditor) part);
					}
				}
			});
		}
	}
}
