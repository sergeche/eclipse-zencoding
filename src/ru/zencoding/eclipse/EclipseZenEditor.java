package ru.zencoding.eclipse;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.eclipse.jface.text.BadLocationException;
import org.eclipse.jface.text.IDocument;
import org.eclipse.jface.text.IRegion;
import org.eclipse.jface.text.ITextSelection;
import org.eclipse.jface.text.ITextViewer;
import org.eclipse.jface.text.TextSelection;
import org.eclipse.jface.text.TextUtilities;
import org.eclipse.jface.text.link.LinkedModeModel;
import org.eclipse.jface.text.link.LinkedModeUI;
import org.eclipse.jface.text.link.LinkedPosition;
import org.eclipse.jface.text.link.LinkedPositionGroup;
import org.eclipse.jface.viewers.ISelection;
import org.eclipse.jface.viewers.ISelectionProvider;
import org.eclipse.jface.window.Window;
import org.eclipse.swt.widgets.Display;
import org.eclipse.swt.widgets.Shell;
import org.eclipse.ui.IEditorPart;

import ru.zencoding.IZenEditor;
import ru.zencoding.PlaceholderItem;
import ru.zencoding.PlaceholderList;
import ru.zencoding.SelectionData;
import ru.zencoding.TabStop;
import ru.zencoding.TabStopGroup;
import ru.zencoding.TabStopStructure;

public class EclipseZenEditor implements IZenEditor {

	private IEditorPart editor;
	private IDocument doc;
	private String caretPlaceholder = "{%::zen-caret::%}";
	
	private ArrayList<String> promptProposals;
	
	private static Pattern whitespaceBegin = Pattern.compile("^(\\s+)");
	
	private static String DIALOG_PROMPT = "prompt";
	private static String DIALOG_WRAP_WITH_ABBREVIATION = "wrap";
	
	private HashMap<String, ArrayList<String>> proposals;
	
	private abstract interface CharTester {
	  public abstract boolean test(char ch);
	}
	
	/**
	 * Handles tabstop instance inside text
	 */
	private abstract interface TabStopHandler {
		/**
		 * Processes single tabstob instance, should return text that will be
		 * pasted into instead of tabstop
		 * @param start Start position of tabstob inside text
		 * @param end End position of tabstob inside text
		 * @param num Tabstop number
		 * @param placeholder Tabstop placeholder
		 * @return
		 */
		public abstract String process(int start, int end, String num, String placeholder);
	}
	
	public EclipseZenEditor() {
		
	}
	
	public EclipseZenEditor(IEditorPart editor) {
		setContext(editor);
	}
	
	public void setContext(IEditorPart editor) {
		this.editor = editor;
		doc = EclipseZenCodingHelper.getDocument(editor);
		if (promptProposals == null)
			promptProposals = new ArrayList<String>();
		if (proposals == null) {
			proposals = new HashMap<String, ArrayList<String>>();
		}
	}
	
	public boolean isValid() {
		return editor != null && doc != null;
	}
	
	@Override
	public SelectionData getSelectionRange() {
		ISelectionProvider sp = editor.getEditorSite().getSelectionProvider();
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
		editor.getEditorSite().getSelectionProvider().setSelection(new TextSelection(start, end - start));
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
		replaceContent(value, 0, doc.getLength(), false);
	}

	@Override
	public void replaceContent(String value, int start) {
		replaceContent(value, start, start, false);
	}
	
	@Override
	public void replaceContent(String value, int start, int end) {
		replaceContent(value, start, end, false);
	}

	@Override
	public void replaceContent(String value, int start, int end, boolean no_indent) {
		String newValue = value;
		if (!no_indent)
			newValue = padString(value, getCurrentLinePadding());
		
		TabStopStructure tabStops = handleTabStops(newValue);
		newValue = tabStops.getText();
		
		try {
			doc.replace(start, end - start, newValue);
			
			int totalLinks = tabStops.getTabStopsCount();
			
			if (totalLinks < 1) {
				tabStops.addTabStopToGroup("carets", newValue.length(), newValue.length());
			}
			
			String[] tabGroups = tabStops.getSortedGroupKeys();
			TabStop firstTabStop = tabStops.getFirstTabStop();
			
			if (totalLinks > 1 || firstTabStop != null && firstTabStop.getStart() != firstTabStop.getEnd()) {
				ITextViewer viewer = EclipseZenCodingHelper.getTextViewer(editor);
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
				
				// Aptana has a buggy linked mode implementation, use simple 
				// mode for it 
				linkUI.setSimpleMode(isApatana());
				linkUI.enter();
			} else {
				setCaretPos(start + firstTabStop.getStart());
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public String getCurrentLinePadding() {
		return getStringPadding(getCurrentLine());
	}
	
	/**
	 * Handle tab-stops (like $1 or ${1:label}) inside text: find them and create
	 * indexes for linked mode
	 */
	private TabStopStructure handleTabStops(String text) {
		ArrayList<Integer> carets = new ArrayList<Integer>();
		
		// find all carets
		if (text.equals(getCaretPlaceholder())) {
			carets.add(0);
			text = "";
		} else {
			String[] chunks = text.split(Pattern.quote(getCaretPlaceholder()), -1);
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
		}
		
		// process all tab-stops
		final HashMap<String, String> placeholders = new HashMap<String, String>();
		final PlaceholderList pMarks = new PlaceholderList();
		
		// remember all placeholder positions first
		final String originalText = text;
		text = processTextBeforePaste(text, new TabStopHandler() {
			@Override
			public String process(int start, int end, String num, String placeholder) {
				String ret = "";
				if (placeholder != null)
					placeholders.put(num, placeholder);
					
				if (placeholders.containsKey(num))
					ret = placeholders.get(num);
				
				pMarks.add(start, end, num, ret);
				
				return originalText.substring(start, end);
			}	
		});
		
		// now, replace all placeholders with actual values
		TabStopStructure tabStops = new TabStopStructure();
		StringBuilder buf = new StringBuilder();
		int lastIx = 0;
		for (int i = 0; i < pMarks.getList().size(); i++) {
			PlaceholderItem p = pMarks.getList().get(i);
			
			buf.append(text.substring(lastIx, p.getStart()));
			
			String ph = "";
			if (placeholders.containsKey(p.getNum()))
				ph = placeholders.get(p.getNum());
			
			tabStops.addTabStopToGroup(p.getNum(), buf.length(), buf.length() + ph.length());
			buf.append(ph);
			
			lastIx = p.getEnd();
		}
		buf.append(text.substring(lastIx));
		
		// add carets
		for (Integer caretPos : carets) {
			tabStops.addTabStopToGroup("carets", (int) caretPos, (int) caretPos);
		}
		
		tabStops.setText(buf.toString());
		
		return tabStops;
	}
	
	private int nextWhile(int ix, String text, CharTester fn) {
		int il = text.length();
		while (ix < il)
			if (!fn.test( text.charAt(ix++) )) break;
		return ix - 1;
	}
	
	/**
	 * Process text that should be pasted into editor: clear escaped text and
	 * handle tabstops
	 * @param {String} text
	 * @param {Function} escape_fn Handle escaped character. Must return
	 * replaced value
	 * @param {Function} tabstop_fn Callback function that will be called on every
	 * tabstob occurance, passing <b>index</b>, <code>number</code> and 
	 * <b>value</b> (if exists) arguments. This function must return 
	 * replacement value
	 */
	private String processTextBeforePaste(String text, TabStopHandler handler) {
		int i = 0;
		int il = text.length();
		int startIx = 0;
		int _i = 0;
		StringBuilder strBuilder = new StringBuilder();
		
		CharTester isNumeric = new CharTester() {
			@Override
			public boolean test(char ch) {
				return Character.isDigit(ch);
			}
		};
		
		while (i < il) {
			char ch = text.charAt(i);
			if (ch == '\\' && i + 1 < il) {
				// handle escaped character
				strBuilder.append(text.charAt(i + 1));
				i += 2;
				continue;
			} else if (ch == '$') {
				// looks like a tabstop
				char next_ch = '\0';
				
				if (i < il)
					next_ch = text.charAt(i + 1);
				
				_i = i;
				if (isNumeric.test(next_ch)) {
					// $N placeholder
					startIx = i + 1;
					i = nextWhile(startIx, text, isNumeric);
					if (startIx < i) {
						strBuilder.append(handler.process(_i, i, text.substring(startIx, i), null));
						continue;
					}
				} else if (next_ch == '{') {
					// ${N:value} or ${N} placeholder
					startIx = i + 2;
					i = nextWhile(startIx, text, isNumeric);
					
					if (i > startIx) {
						if (text.charAt(i) == '}') {
							strBuilder.append(handler.process(_i, i + 1, text.substring(startIx, i), null));
							i++; // handle closing brace
							continue;
						} else if (text.charAt(i) == ':') {
							int val_start = i + 2;
							i = nextWhile(val_start, text, new CharTester() {
								private int brace_count = 1;
								public boolean test(char ch) {
									if (ch == '{') brace_count++;
									else if (ch == '}') brace_count--;
									return brace_count != 0;
								}
							});
							strBuilder.append(handler.process(_i, i + 1, text.substring(startIx, val_start - 2), text.substring(val_start - 1, i)));
							i++; // handle closing brace
							continue;
						}
					}
				}
				i = _i;
			}
			
			// push current character to stack
			strBuilder.append(ch);
			i++;
		}
		
		return strBuilder.toString();
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
	
	public String getNewline() {
		return TextUtilities.getDefaultLineDelimiter(doc);
	}
	
	/**
	 * Indents text with padding
	 * @param {String} text Text to indent
	 * @param {String|Number} pad Padding size (number) or padding itself (string)
	 * @return {String}
	 */
	public String padString(String text, String pad) {
		StringBuilder result = new StringBuilder();
		String newline = getNewline();
		String lines[] =  text.split("\\r\\n|\\n\\r|\\r|\\n", -1);
		
		if (lines.length > 0) {
			result.append(lines[0]);
			for (int i = 1; i < lines.length; i++) {
				result.append(newline + pad + lines[i]);
			}
		} else {
			result.append(text);
		}
			
		return result.toString();
	}

	@Override
	public String getContent() {
		return doc.get();
	}

	@Override
	public String getSyntax() {
		return EditorTypeInvestigator.getSyntax(this);
	}

	@Override
	public String getProfileName() {
		return EditorTypeInvestigator.getOutputProfile(this);
	}

	public String prompt(String type, String title) {

		final Display currentDisplay = Display.getCurrent();
		String defaultValueArg = "";

		/**
		 * Answer
		 */
		class Answer {
			public String result = "";
		}

		final String message = title;
		final String dialogType = type;
		final String defaultValue = defaultValueArg;
		final Answer a = new Answer();

		if (currentDisplay != null) {
			currentDisplay.syncExec(new Runnable() {

				public void run() {
					Shell shell = currentDisplay.getActiveShell();

					if (shell != null) {
						AutoCompleteDialog dialog = dialogFactory(dialogType, message, defaultValue);
						int dialogResult = dialog.open();
						if (dialogResult == Window.OK) {
							a.result = dialog.getValue();
							addProposal(message, a.result);
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
	public String prompt(String title) {
		return prompt(DIALOG_PROMPT, title);
	}
	
	public String promptWrap(String title) {
		return prompt(DIALOG_WRAP_WITH_ABBREVIATION, title);
	}
	
	private AutoCompleteDialog dialogFactory(String type, String message, String defaultValue) {
		AutoCompleteDialog dialog;
		if (type == DIALOG_WRAP_WITH_ABBREVIATION) {
			dialog = new WrapWithAbbreviationDialog(null, "Zen Coding Prompt", message, defaultValue);
		} else {
			dialog = new AutoCompleteDialog(null, "Zen Coding Prompt", message, defaultValue);
		}
		
		dialog.setProposals(getProposals(message));
		return dialog;
	}
	
	private ArrayList<String> getProposals(String title) {
		if (proposals.containsKey(title))
			return proposals.get(title);
		
		return null;
	}
	
	private void addProposal(String title, String value) {
		if (!value.equals("")) {
			if (!proposals.containsKey(title))
				proposals.put(title, new ArrayList<String>());
			
			ArrayList<String> props = proposals.get(title);
			if (!props.contains(value))
				props.add(0, value);
		}
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
		return EclipseZenCodingHelper.getURI(editor).substring(5);
	}
	
	public IEditorPart getEditor() {
		return editor;
	}
	
	public IDocument getDocument() {
		return doc;
	}

	public String getCaretPlaceholder() {
		return caretPlaceholder;
	}
	
	public boolean isApatana() {
		return getEditor().toString().toLowerCase().indexOf(".aptana.") != -1;
	}
	
	public void print(String msg) {
		System.out.println("ZC: " + msg);
	}
	
	/**
	 * Removes caret placeholders and tabstops from text
	 * @param text
	 * @return
	 */
	public String cleanText(String text) {
		return handleTabStops(text).getText();
	}
}
