package ru.zencoding.eclipse.handlers;

import ru.zencoding.JSExecutor;
import ru.zencoding.SelectionData;
import ru.zencoding.eclipse.EclipseZenCodingHelper;
import ru.zencoding.eclipse.EclipseZenCodingPlugin;
import ru.zencoding.eclipse.EclipseZenEditor;
import ru.zencoding.eclipse.EditorTypeInvestigator;
import ru.zencoding.eclipse.preferences.PreferenceConstants;

public class InsertFormattedLineBreakAction {

	public static boolean execute() {
		if (!isEnabled()) return false;
		
		EclipseZenEditor editor = ActionRunner.getSingleton().getEditor();
		
		if (editor != null && shouldHandle(editor)) {
			try {
				Boolean result = JSExecutor.getSingleton().runAction(editor, new Object[]{"insert_formatted_line_break_only"});
				if (!result) {
					String curPadding = editor.getCurrentLinePadding();
					String content = editor.getContent();
					int caretPos = editor.getCaretPos();
					int c_len = content.length();
					String nl = editor.getNewline();
					
					// check out next line padding
					SelectionData lineRange = editor.getCurrentLineRange();
					StringBuilder nextPadding = new StringBuilder();
					
					for (int i = lineRange.getEnd() + 1; i < c_len; i++) {
						char ch = content.charAt(i);
						if (ch == ' ' || ch == '\t')
							nextPadding.append(ch);
						else 
							break;
					}
						
					if (nextPadding.length() > curPadding.length()) {
						editor.replaceContent(nl + nextPadding.toString(), caretPos, caretPos, true);
						result = true;
					}
				}
				
				return result;
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return false;
	}
	
	public static boolean isEnabled() {
		return EclipseZenCodingPlugin.getDefault().getPreferenceStore()
			.getBoolean(PreferenceConstants.P_UPGRADE_EDITORS);
	}
	
	/**
	 * Check if newline insertion should be handled for passed editor
	 * @param editor
	 * @return
	 */
	public static boolean shouldHandle(EclipseZenEditor editor) {
		String ed = EclipseZenCodingHelper.getEditorString(editor);
		return ed.indexOf("org.eclipse.wst.sse") != -1 
			|| ed.indexOf("org.eclipse.wst.xsl") != -1
			|| (EclipseZenCodingHelper.isApatana(editor) 
					&& editor.getSyntax() == EditorTypeInvestigator.TYPE_CSS);
	}
}
