package ru.zencoding.eclipse;

import java.lang.reflect.Field;

import org.eclipse.jface.text.IDocument;
import org.eclipse.jface.text.ITextViewer;
import org.eclipse.ui.IEditorPart;
import org.eclipse.ui.PlatformUI;
import org.eclipse.ui.part.MultiPageEditorPart;
import org.eclipse.ui.texteditor.AbstractTextEditor;
import org.eclipse.ui.texteditor.DocumentProviderRegistry;
import org.eclipse.ui.texteditor.IDocumentProvider;

/**
 * Helper object that provides some commonly used functions for Zen Coding
 * @author sergey
 *
 */
public class EclipseZenCodingHelper {
	public static IEditorPart getActiveEditor() {
		IEditorPart editor = PlatformUI.getWorkbench().getActiveWorkbenchWindow().getActivePage().getActiveEditor();
		return getTextEditor(editor);
	}

	/**
	 * Returns text editor object from given editor part. If given part is multipage editor,
	 * it tries to find text editor in it
	 * @param editor
	 * @return
	 */
	public static IEditorPart getTextEditor(IEditorPart editor) {
		if (editor instanceof MultiPageEditorPart) {
			Object currentPage = ((MultiPageEditorPart) editor).getSelectedPage();
			if (currentPage instanceof AbstractTextEditor)
				editor = (AbstractTextEditor) currentPage;
			else
				editor = null;
		}
		return editor;
	}
	
	public static IDocument getActiveDocument() {
		return getDocument(getActiveEditor());
	}
	
	public static IDocument getDocument(IEditorPart editor) {
		if (editor != null) {
			IDocumentProvider dp = null;
			if (editor instanceof AbstractTextEditor)
				dp = ((AbstractTextEditor) editor).getDocumentProvider();
			
			if (dp == null)
				dp = DocumentProviderRegistry.getDefault().getDocumentProvider(editor.getEditorInput());
			
			if (dp != null)
				return (IDocument) dp.getDocument(editor.getEditorInput());
		}
		
		return null;
	}
	
	public static ITextViewer getTextViewer(IEditorPart editor) {
		Field svField;
		
		if (editor instanceof AbstractTextEditor) {
			try {
				svField = AbstractTextEditor.class.getDeclaredField("fSourceViewer");
				svField.setAccessible(true);
				return (ITextViewer) svField.get((AbstractTextEditor) editor);
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return null;
	}
}
