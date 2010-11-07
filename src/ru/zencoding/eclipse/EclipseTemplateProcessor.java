package ru.zencoding.eclipse;

import java.util.ArrayList;

import ru.zencoding.JSExecutor;

/**
 * Processes Eclipse template and converts it to Zen Coding abbreviation/snippet
 * @author sergey
 *
 */
public class EclipseTemplateProcessor {
	/**
	 * Convert Eclipse template to Zen Coding entry
	 * @param template
	 * @return
	 */
	public static String process(String template) {
		ArrayList<String> variables = new ArrayList<String>();
		StringBuffer result = new StringBuffer();
		
		char ch;
		char nextCh;
		int i = 0;
		int len = template.length();
		int varEnd;
		int varPos;
		String varName;
		
		while (i < len) {
			ch = template.charAt(i);
			nextCh = (i < len - 1) ? template.charAt(i + 1) : '\0';
			
			if (ch == '$') {
				if (nextCh == '$') { // escaping dollar sign
					result.append("\\$");
					i++;
				} else if (nextCh == '{') { // variable start
					varEnd = template.indexOf('}', i);
					if (varEnd != -1) {
						varName = template.substring(i + 2, varEnd);
						if (varName.equals("cursor")) {
							result.append('|');
						} else if (varName.equals("child") || JSExecutor.getSingleton().hasVariable(varName)) {
							// ZC has predefined variable of that name, leave as is
							result.append("${" + varName + "}");
						} else {
							varPos = variables.indexOf(varName);
							if (varPos == -1) {
								variables.add(varName);
								varPos = variables.size() - 1;
							}
							
							result.append("${" + varPos + ":" + varName + "}");
						}
						i = varEnd;
					} else {
						result.append(ch);
					}
					
				} else { // just a dollar sign, escape it
					result.append("\\$");
				}
			} else {
				result.append(ch);
			}
			
			i++;
		}
		
		return result.toString();
	}
}
