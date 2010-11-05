package ru.zencoding.eclipse.preferences.output;

public class OutputProfile {
	public static final String LOWERCASE = "lower";
	public static final String UPPERCASE = "upper";
	public static final String LEAVE = "leave";
	public static final String SINGE_QUOTES = "single";
	public static final String DOUBLE_QUOTES = "double";
	public static final String TRUE = "true";
	public static final String FALSE = "false";
	public static final String DECIDE = "decide";
	public static final String XHTML_STYLE = "xhtml";

	private String tagCase = LOWERCASE;
	private String attrCase = LOWERCASE;
	private String attrQuotes = DOUBLE_QUOTES;
	private String tagNewline = DECIDE;
	private boolean placeCaret = true;
	private boolean indentTags = true;
	private int inlineBreak = 3;
	private String selfClosing = XHTML_STYLE;
	private String filters = "";

	public String getAttrCase() {
		return attrCase;
	}

	public void setAttrCase(String attrCase) {
		this.attrCase = attrCase;
	}

	public String getAttrQuotes() {
		return attrQuotes;
	}

	public void setAttrQuotes(String attrQuotes) {
		this.attrQuotes = attrQuotes;
	}

	public String getTagNewline() {
		return tagNewline;
	}

	public void setTagNewline(String tagNewline) {
		this.tagNewline = tagNewline;
	}

	public boolean isPlaceCaret() {
		return placeCaret;
	}

	public void setPlaceCaret(boolean placeCaret) {
		this.placeCaret = placeCaret;
	}

	public boolean isIndentTags() {
		return indentTags;
	}

	public void setIndentTags(boolean indentTags) {
		this.indentTags = indentTags;
	}

	public int getInlineBreak() {
		return inlineBreak;
	}

	public void setInlineBreak(int inlineBreak) {
		this.inlineBreak = inlineBreak;
	}

	public String getSelfClosing() {
		return selfClosing;
	}

	public void setSelfClosing(String selfClosing) {
		this.selfClosing = selfClosing;
	}

	public void setTagCase(String tagCase) {
		this.tagCase = tagCase;
	}

	public String getTagCase() {
		return tagCase;
	}

	public void setFilters(String filters) {
		this.filters = filters;
	}

	public String getFilters() {
		return filters;
	}
}
