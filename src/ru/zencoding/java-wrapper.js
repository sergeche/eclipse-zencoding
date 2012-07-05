/**
 * Short-hand functions for Java wrapper
 * @author Sergey Chikuyonok (serge.che@gmail.com)
 * @link http://chikuyonok.ru
 */

function require(name) {
	return zen_coding.require(name);
}

/**
 * Runs Zen Coding action
 * @param {ZenEditor} editor
 * @param {String} actionName
 * @return {Boolean}
 */
function runZenCodingAction(editor, actionName){
	var args = [editor];
	for (var i = 2, il = arguments.length; i < il; i++) {
		args.push(arguments[i]);
	}
	
	return require('actions').run(actionName, args);
}

/**
 * Removes all user defined settings
 */
function resetUserSettings() {
	require('resources').setVocabulary({}, 'user');
}

/**
 * Adds user defined resource (abbreviation or snippet)
 * @param {String} syntax
 * @param {String} type
 * @param {String} abbr
 * @param {String} value
 */
function addUserResource(syntax, type, abbr, value) {
	var res = require('resources');
	var voc = res.getVocabulary('user') || {};
	if (!(syntax in voc))
		voc[syntax] = {};
		
	if (!(type in voc[syntax]))
		voc[syntax][type] = {};
		
	voc[syntax][type][abbr] = value;
	
	res.setVocabulary(voc, 'user');
}

function hasZenCodingVariable(name) {
	return !!require('resources').getVariable(name);
}

function tryBoolean(val) {
	var strVal = String(val || '').toLowerCase();
	if (strVal == 'true')
		return true;
	if (strVal == 'false')
		return false;
		
	var intVal = parseInt(strVal, 10);
	if (!isNaN(intVal))
		return intVal;
	
	return strVal;
}

function setupOutputProfile(name, profileObj) {
	var map = {
		tag_case: 'getTagCase',
		attr_case: 'getAttrCase',
		attr_quotes: 'getAttrQuotes',
		tag_nl: 'getTagNewline',
		place_cursor: 'isPlaceCaret',
		indent: 'isIndentTags',
		inline_break: 'getInlineBreak',
		self_closing_tag: 'getSelfClosing',
		filters: 'getFilters'
	};
	
	var profile = {};
	
	_.each(map, function(p, k) {
		profile[k] = tryBoolean(profileObj[p]());
	});
		
	require('profile').create(String(name), profile);
}

function addUserVariable(name, value) {
	require('resources').setVariable(name, value);
}

function previewWrapWithAbbreviation(editor, abbr) {
	abbr = String(abbr);
	if (!abbr)
		return null;
	
	var editorUtils = require('editorUtils');
	var utils = require('utils');
	var info = editorUtils.outputInfo(editor);
	
	var range = editor.getSelectionRange(),
		startOffset = range.start,
		endOffset = range.end;
		
	if (startOffset == endOffset) {
		// no selection, find tag pair
		range = zen_coding.require('html_matcher')(info.content, startOffset, info.profile);
		
		if (!range || range[0] == -1) // nothing to wrap
			return null;
		
		var narrowedSel = utils.narrowToNonSpace(info.content, range[0], range[1] - range[0]);
		startOffset = narrowedSel.start;
		endOffset = narrowedSel.end;
	}
	
	var newContent = utils.escapeText(info.content.substring(startOffset, endOffset));
	return require('wrapWithAbbreviation').wrap(abbr, editorUtils.unindent(editor, newContent), info.syntax, info.profile) 
		|| null;
}

function strToJSON(data) {
	try {
		return (new Function('return ' + String(data)))();
	} catch(e) {
		log('Error while parsing JSON: ' + e);
		return {};
	}
}

function javaLoadUserSnippets(settingsData, userDefaults) {
	settingsData = strToJSON(settingsData);
	userDefaults = strToJSON(userDefaults);
	var data = require('utils').deepMerge({}, settingsData, userDefaults);
	require('resources').setVocabulary(data, 'user');
}

function javaLoadUserPreferences(data) {
	if (data)
		require('preferences').load(strToJSON(data));
}

function javaLoadSystemSnippets(data) {
	if (data) {
		require('resources').setVocabulary(strToJSON(data), 'system');
	}
}

function javaExtractTabstops(text) {
	return require('tabStops').extract(text, {
		escape: function(ch) {
			return ch;
		}
	});
}

function log(message) {
	java.lang.System.out.println('JS: ' + message);
}