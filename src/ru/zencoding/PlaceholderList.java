package ru.zencoding;

import java.util.ArrayList;
import java.util.Collections;

public class PlaceholderList {
	private ArrayList<PlaceholderItem> list;
	
	public PlaceholderList() {
		list = new ArrayList<PlaceholderItem>();
	}
	
	public PlaceholderItem add(int start, int end, String num, String placeholder) {
		PlaceholderItem item = new PlaceholderItem(start, end, num, placeholder);
		list.add(item);
		return item;
	}
	
	public ArrayList<PlaceholderItem> getList() {
		return list;
	}
	
	public ArrayList<PlaceholderItem> getReversedList() {
		@SuppressWarnings("unchecked")
		ArrayList<PlaceholderItem> _list = (ArrayList<PlaceholderItem>) list.clone();
		Collections.reverse(_list);
		return _list;
	}
}
