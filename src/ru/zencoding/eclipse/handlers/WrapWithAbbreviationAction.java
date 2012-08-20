package ru.zencoding.eclipse.handlers;

import org.eclipse.core.commands.AbstractHandler;
import org.eclipse.core.commands.ExecutionEvent;
import org.eclipse.core.commands.ExecutionException;

import ru.zencoding.JSExecutor;
import ru.zencoding.eclipse.EclipseZenEditor;

public class WrapWithAbbreviationAction extends AbstractHandler {

	@Override
	public Object execute(ExecutionEvent event) throws ExecutionException {
		ActionRunner runner = ActionRunner.getSingleton();
		EclipseZenEditor editor = runner.getEditor();
		JSExecutor js = JSExecutor.getSingleton();
		String profileName = "eclipse";
		
		if (editor != null) {
			try {
				String abbr = editor.promptWrap("Enter abbreviation:");
				
				if (abbr != null && !abbr.equals("")) {
					// expand abbreviation with current profile
					return js.runAction(editor, "wrap_with_abbreviation", 
							abbr, editor.getSyntax(), profileName);
				}
				
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		
		return null;
	}

}
