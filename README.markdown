h1. Zen Coding

Zen Coding is an editor plugin for high-speed HTML, XML, XSL (or any other structured code format) coding and editing. The core of this plugin is a powerful abbreviation engine which allows you to expand expressionsÑsimilar to CSS selectorsÑinto HTML code. For example:

@div#page>div.logo+ul#navigation>li*5>a@

...can be expanded into:

```
<div id="page">
        <div class="logo"></div>
        <ul id="navigation">
                <li><a href=""></a></li>
                <li><a href=""></a></li>
                <li><a href=""></a></li>
                <li><a href=""></a></li>
                <li><a href=""></a></li>
        </ul>
</div>
```

[[Read more about current Zen Coding syntax|http://code.google.com/p/zen-coding/wiki/ZenHTMLSelectorsEn]]

h2. Plugin Overview

This plugin provides native Zen Coding support for Eclipse. Unlike the [[previous version|http://code.google.com/p/zen-coding/wiki/AptanaHowToEn]], this plugin doesn't require EclipseMonkey/Aptana to be installed in your Eclipse IDE and provides superior feature support:

* Expand abbreviations by Tab key
* Simple install and update process
* Change action shortcuts in Eclipse's Keys preferences page
* Works across all Eclipse editors (even in WebTool's XML Editor; the EclipseMonkey plugin throws exception on it)
* Preferences support to fine-tune output for each syntax and add new abbreviations and snippets
[[http://zen-coding.ru/eclipse/prefs.png]]

h2. Installation

1. Go to _Help > Install New Software..._ in your Eclipse IDE
2. Add http://zen-coding.ru/eclipse/updates/ in update sites
3. Check _Zen Coding for Eclipse_ group in available plugins list, click Next button and follow the installation instructions
4. Restart Eclipse

h3. Notes

This plugin was tested in Eclipse 3.6 Helios, but should work fine in 3.5 Galileo

*Aptana 3 Beta users:* since Aptana 3 can also expand snippets by Tab key, there might be collisions in expanded result (for example, for @div@ tag). You can remove unused snippets for Aptana bundles in order to make Zen Coding plugin work properly.   

*WARNING: this plugin doesn't work Aptana 2 Standalone. Please download Eclipse IDE from http://eclipse.org/ and install Aptana as a plugin in it*