package ru.zencoding;


import java.util.Arrays;
import java.util.Enumeration;
import java.util.Properties;

/**
 * A coomon structure that contains list of tabstop groups and valid
 * text for these groups
 * @author sergey
 *
 */
public class TabStopStructure {
	/**
	 * Valid text for current tabstob structure
	 */
	private String text = "";
	private Properties groups;
	
	public TabStopStructure() {
		createGroups();
	}
	
	public TabStopStructure(String text) {
		setText(text);
		createGroups();
	}
	
	private void createGroups() {
		groups = new Properties();
	}

	public void setText(String text) {
		this.text = text;
	}

	public String getText() {
		return text;
	}
	
	public void addTabStopToGroup(String groupName, int start, int end) {
		if (!groups.containsKey(groupName)) {
			groups.put(groupName, new TabStopGroup());
		}
		
		getTabStopGroup(groupName).addTabStop(start, end);
	}

	public Properties getGroups() {
		return groups;
	}
	
	/**
	 * Returns total amount of tabstops in current structure
	 * @return
	 */
	public int getTabStopsCount() {
		int result = 0;
		
		for (Enumeration<Object> elements = groups.elements(); elements.hasMoreElements();) {
			result += ((TabStopGroup) elements.nextElement()).getLength();
		}
		
		return result;
	}
	
	public String[] getSortedGroupKeys() {
		String[] keys = new String[groups.size()];
		int counter = 0;
		
		for (Enumeration<Object> e = groups.keys(); e.hasMoreElements();) {
			keys[counter] = (String) e.nextElement();
			counter++;
		}
		
		Arrays.sort(keys);
		
		return keys;
	}
	
	public TabStopGroup getTabStopGroup(String groupName) {
		return (TabStopGroup) groups.get(groupName);
	}
	
	public TabStop getTabStop(String groupName, int index) {
		return getTabStopGroup(groupName).getTabStopList().get(index);
	}
}
