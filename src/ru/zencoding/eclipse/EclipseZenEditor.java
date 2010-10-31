package ru.zencoding.eclipse;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.eclipse.core.resources.IFile;
import org.eclipse.jface.dialogs.InputDialog;
import org.eclipse.jface.text.BadLocationException;
import org.eclipse.jface.text.Document;
import org.eclipse.jface.text.IRegion;
import org.eclipse.jface.text.ITextSelection;
import org.eclipse.jface.text.ITextViewer;
import org.eclipse.jface.text.link.LinkedModeModel;
import org.eclipse.jface.text.link.LinkedModeUI;
import org.eclipse.jface.text.link.LinkedPosition;
import org.eclipse.jface.text.link.LinkedPositionGroup;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.jface.viewers.ISelectionProvider;
import org.eclipse.jface.window.Window;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.ui.editors.text.TextEditor;
import org.eclipse.ui.texteditor.AbstractTextEditor;
import org.eclipse.ui.texteditor.IDocumentProvider;

import ru.zencoding.IZenEditor;
import ru.zencoding.SelectionData;
import ru.zencoding.TabStop;
import ru.zencoding.TabStopGroup;
import ru.zencoding.TabStopStructure;

public class EclipseZenEditor implements IZenEditor {

	private TextEditor editor;
	private Document doc;
	private String caretPlaceholder = "{%::zen-caret::%}";
	
	private static Pattern whitespaceBegin = Pattern.compile("^(\\s+)");
	private static Pattern reTabStops = Pattern.compile("\\$(\\d+)|\\$\\{(\\d+)(\\:[^\\}]+)?\\}");
	
	public EclipseZenEditor() {
		
	}
	
	public EclipseZenEditor(TextEditor editor) {
		setContext(editor);
	}
	
	public static ITextViewer getTextViewer(TextEditor editor) throws Exception {
		Field svField = AbstractTextEditor.class.getDeclaredField("fSourceViewer");
		svField.setAccessible(true);
		return (ITextViewer) svField.get((AbstractTextEditor) editor);
	}
	
	public void setContext(TextEditor editor) {
		this.editor = editor;
		IDocumentProvider dp = editor.getDocumentProvider();
		doc = (Document) dp.getDocument(editor.getEditorInput());
	}
	
	@Override
	public SelectionData getSelectionRange() {
		ISelectionProvider sp = editor.getSelectionProvider();
		ISelection selection = sp.getSelection();
			
		SelectionData result = new SelectionData();
		
		if (selection instanceof ITextSelection) {
			ITextSelection txSel = (ITextSelection) selection;
			result.updateRangeWithLength(txSel.getOffset(), txSel.getLength());
		}
		
		return result;
	}

	@Override
	public void createSelection(int start, int end) {
		editor.selectAndReveal(start, end - start);
	}

	@Override
	public SelectionData getCurrentLineRange() {
		SelectionData result = new SelectionData();
		
		try {
			IRegion lineInfo = doc.getLineInformationOfOffset(getCaretPos());
			result.updateRangeWithLength(lineInfo.getOffset(), lineInfo.getLength());
		} catch (BadLocationException e) { }
		
		return result;
	}

	@Override
	public int getCaretPos() {
		return getSelectionRange().getStart();
	}

	@Override
	public void setCaretPos(int pos) {
		createSelection(pos, pos);
	}

	@Override
	public String getCurrentLine() {
		SelectionData curLineRange = getCurrentLineRange();
		try {
			return doc.get(curLineRange.getStart(), curLineRange.getLength());
		} catch (BadLocationException e) {
			return "";
		}
	}

	@Override
	public void replaceContent(String value) {
		replaceContent(value, 0, doc.getLength());
	}

	@Override
	public void replaceContent(String value, int start) {
		replaceContent(value, start, start);
	}

	@Override
	public void replaceContent(String value, int start, int end) {
		String newValue = padString(value, getStringPadding(getCurrentLine()));
		TabStopStructure tabStops = handleTabStops(newValue);
		newValue = tabStops.getText();
		
		try {
			doc.replace(start, end - start, newValue);
			
			int totalLinks = tabStops.getTabStopsCount();
			String[] tabGroups = tabStops.getSortedGroupKeys();
			
			if (totalLinks < 1) {
				tabStops.addTabStopToGroup("carets", newValue.length(), newValue.length());
			}
			
			TabStop firstTabStop = tabStops.getTabStop(tabGroups[0], 0);
			
			if (totalLinks > 1 || firstTabStop.getStart() != firstTabStop.getEnd()) {
				ITextViewer viewer = getTextViewer();
				LinkedModeModel model = new LinkedModeModel();
				
				for (int i = 0; i < tabGroups.length; i++) {
					TabStopGroup tabGroup = tabStops.getTabStopGroup(tabGroups[i]);
					LinkedPositionGroup group = null;
					
					if (tabGroups[i].equals("carets")) {
						for (int j = 0; j < tabGroup.getTabStopList().size(); j++) {
							TabStop ts = tabGroup.getTabStopList().get(j);
							group = new LinkedPositionGroup();
							group.addPosition(new LinkedPosition(doc, start + ts.getStart(), ts.getLength()));
							model.addGroup(group);
						}
					} else {
						group = new LinkedPositionGroup();
						
						for (int j = 0; j < tabGroup.getTabStopList().size(); j++) {
							TabStop ts = tabGroup.getTabStopList().get(j);
							group.addPosition(new LinkedPosition(doc, start + ts.getStart(), ts.getLength()));
						}
						
						model.addGroup(group);
					}
				}
				
				model.forceInstall();
				
				LinkedModeUI linkUI = new LinkedModeUI(model, viewer);
				linkUI.enter();
			} else {
				setCaretPos(start + firstTabStop.getStart());
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
	
	public ITextViewer getTextViewer() throws Exception {
		return getTextViewer(editor);
	}
	
	private String findTabStopLabels(String text, Properties tabStopLabels) {
		Pattern reLabels = Pattern.compile("\\$\\{(\\d+):([^\\}]+)\\}");
		Matcher mLabels = reLabels.matcher(text);
		StringBuffer sbLabels = new StringBuffer();
		while (mLabels.find()) {
			tabStopLabels.put(mLabels.group(0), mLabels.group(1));
			mLabels.appendReplacement(sbLabels, "");
		}
		
		mLabels.appendTail(sbLabels);
		return sbLabels.toString();
	}
	
	private String normalizeTabStops(String text, Properties tabStopLabels) {
		Matcher mLabels = reTabStops.matcher(text);
		StringBuffer sbLabels = new StringBuffer();
		String labelNum;
		while (mLabels.find()) {
			if (!mLabels.group(0).isEmpty())
				labelNum = mLabels.group(0);
			else
				labelNum = mLabels.group(1);
			
			if (tabStopLabels.containsKey(labelNum)) {
				mLabels.appendReplacement(sbLabels, "${" + labelNum + ":" + tabStopLabels.get(labelNum) + "}");
			}
		}
		
		mLabels.appendTail(sbLabels);
		
		return sbLabels.toString();
	}
	
	private TabStopStructure createTabStopStructure(String text, Properties tabStopLabels) {
		TabStopStructure structure = new TabStopStructure();
		Matcher mLabels = reTabStops.matcher(text);
		StringBuffer sbLabels = new StringBuffer();
		String label;
		String labelNum;
		
		while (mLabels.find()) {
			if (!mLabels.group(0).isEmpty())
				labelNum = mLabels.group(0);
			else
				labelNum = mLabels.group(1);
			
			label = (String) tabStopLabels.get(labelNum);
			if (label == null)
				label = "";
			
			// replace tab-stop with label
			mLabels.appendReplacement(sbLabels, label);
			
			// save tabstop position
			structure.addTabStopToGroup(labelNum, sbLabels.length() - label.length(), sbLabels.length());
		}
		
		mLabels.appendTail(sbLabels);
		
		structure.setText(sbLabels.toString());
		
		return structure;
	}
	
	/**
	 * Handle tab-stops (like $1 or ${1:label}) inside text: find them and create
	 * indexes for linked mode
	 * @param {String} text
	 * @return 
	 * @return {Array} Array with new text and selection indexes (['...', -1,-1] 
	 * if there's no selection)
	 */
	private TabStopStructure handleTabStops(String text) {
		ArrayList<Integer> carets = new ArrayList<Integer>();
		
		// find all carets
		String[] chunks = text.split(Pattern.quote(getCaretPlaceholder()));
		int offset = 0;
		StringBuilder buf = new StringBuilder();
		
		if (chunks.length > 1) {
			for (int i = 0; i < chunks.length - 1; i++) {
				offset += chunks[i].length();
				carets.add(offset);
				buf.append(chunks[i]);
			}
			
			text = buf.toString() + chunks[chunks.length - 1];
		}
		
		// now, process all tab-stops
		// we should process it in three iterations: find labels for tab-stops first,
		// then replace short notations (like $1) with labels (normalize), and 
		// finally save their positions
		Properties tabStopLabels = new Properties();
		text = findTabStopLabels(text, tabStopLabels);
		text = normalizeTabStops(text, tabStopLabels);
		
		TabStopStructure tabStops = createTabStopStructure(text, tabStopLabels);
		
		// add carets
		for (Integer caretPos : carets) {
			tabStops.addTabStopToGroup("carets", (int) caretPos, (int) caretPos);
		}
		
		return tabStops;
	}
	
	/**
	 * Returns whitespace padding from the beginning of the text
	 * @param text
	 * @return
	 */
	private String getStringPadding(String text) {
		Matcher matcher = whitespaceBegin.matcher(text);
		if (matcher.find()) {
			return matcher.group(0);
		} else {
			return "";
		}
	}
	
	/**
	 * Repeats string <code>howMany</code> times
	 */
	public String repeatString(String str, int howMany) {
		StringBuilder result = new StringBuilder();
		
		for (int i = 0; i < howMany; i++) {
			result.append(str);
		}
		
		return result.toString();
	}
	
	/**
	 * Indents text with padding
	 * @param {String} text Text to indent
	 * @param {String|Number} pad Padding size (number) or padding itself (string)
	 * @return {String}
	 */
	public String padString(String text, String pad) {
		StringBuilder result = new StringBuilder();
		
		String lines[] = text.split("\\r?\\n");
		String newline = doc.getDefaultLineDelimiter();
			
		if (lines.length > 0) {
			result.append(lines[0]);
			for (int i = 1; i < lines.length; i++) {
				result.append(newline + pad + lines[i]);
			}
		}
			
		return result.toString();
	}

	@Override
	public String getContent() {
		return doc.get();
	}

	@Override
	public String getSyntax() {
		return EditorTypeInvestigator.getSingleton().getSyntax(this);
	}

	@Override
	public String getProfileName() {
		return EditorTypeInvestigator.getSingleton().getOutputProfile(this);
	}

	@Override
	public String prompt(String title) {

		final Display currentDisplay = Display.getCurrent();
		String defaultValueArg = "";

		/**
		 * Answer
		 */
		class Answer {
			public String result = "";
		}

		final String message = title;
		final String defaultValue = defaultValueArg;
		final Answer a = new Answer();

		if (currentDisplay != null) {
			currentDisplay.syncExec(new Runnable() {

				public void run() {
					Shell shell = currentDisplay.getActiveShell();

					if (shell != null) {
						InputDialog dialog = new InputDialog(null, "Zen Coding Prompt", message, defaultValue, null); //$NON-NLS-1$
						int dialogResult = dialog.open();
						if (dialogResult == Window.OK) {
							a.result = dialog.getValue();
						} else {
							a.result = "";
						}
					}
				}
			});
		}

		return a.result;
	}

	@Override
	public String getSelection() {
		SelectionData selection = getSelectionRange();
		try {
			return doc.get(selection.getStart(), selection.getLength());
		} catch (BadLocationException e) {
			return "";
		}
	}

	@Override
	public String getFilePath() {
		IFile file = (IFile) editor.getEditorInput().getAdapter(IFile.class);
		String path = "";
		if (file != null) {
			path = file.getLocation().makeAbsolute().toOSString();
		}
		
		return path;
	}
	
	public TextEditor getEditor() {
		return editor;
	}
	
	public Document getDocument() {
		return doc;
	}

	public String getCaretPlaceholder() {
		return caretPlaceholder;
	}
	
	public void print(String msg) {
		System.out.println("ZC: " + msg);
	}

}
