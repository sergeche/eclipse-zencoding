package ru.zencoding;

public class PlaceholderItem {
	private int start;
	private int end;
	private String num;
	private String placeholder;
	
	public PlaceholderItem(int start, int end, String num, String placeholder) {
		this.start = start;
		this.end = end;
		this.num = num;
		this.placeholder = placeholder;
	}

	public int getStart() {
		return start;
	}

	public int getEnd() {
		return end;
	}

	public String getNum() {
		return num;
	}

	public String getPlaceholder() {
		return placeholder;
	}
}
