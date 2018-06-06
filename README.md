# svg-multiline-text
This repo is for creating a plugin for SnapSVG enabling setting multiline text

TO Publish to NPM
RUN: 'npm publish --access=public'

TODO:

ADD BABEL? AND WEBPACK TO BUILD. SEE MEDIUM!?



// FORMATTED VERSION IN EMAIL

Genera​​​l

​When using text in SVG, it's important to know whether the course ​​will be localized or not. If yes, all the text of the course have to be found in localizable fields in the admin. It's good practise to place the text in admin even when they won't be localized because having them in admin will make it easier to change them after the piloting or after a few years when they need to be updated as outdated.

See course 'Special Feature Examples​' under 'Prewise Development' for examples in Gimlet Work.

One lined texts

Text that will require only one line can be set to SVG text element by Knockout binding. Add

​data-bind="text: $root.training.customText('txt1')"​

​​

​to the text element in SVG to bind the text defined in admin with id 'txt1'.

Multiline wrapped texts

This is a feature that was added to the player in version 1.15.0. The feature was done as a Snap.svg plugin or actually 2. The 1st plugin is 'multitext'. 

​​​​Multitext

Plugin adds a new method for Paper that adds text to a text element wrapping too long text to multible rows. Here's what it does:

Cleans and formats the text removing all tags. <p> and <br> tags are still supported.
Sets paddings 
Calculates where to wrap the new lines
Sets the align
Renames the id by adding "-ml" to the end (MultiLine)
Sets line height
​Sets the expand direction​
Appends the new text element under a parent element if one set 
The method takes 3 paramenters: 

​​BBox - Object with properties x, y, width (and possibly height, which will be ignored)
Text - String placed to the text element
Attributes - Object with properties:
font-family​ - String like "'The Message'" or "Arial"
​font-size - String or Number
fill - String setting the text color like "#DD9922​​"​
font-weight - String or Number (optional)
"100" = light
"400" = regular
"600" = bold
text-anchor - String with value "start", "end", "middle" (optional)
vdirection - String with value "both" or "up" (optional)
dy - Strimg setting a line height like "1.5em" (optional)
padding - Array with 1 to 4 items similar to CSS, "[0, 20, 0, 50]" (optional)
This method will be useful when need to add a text element inside a rectangle or other square shaped graphic it's also used by the setText method of SVG (Text) Element.

 

​SetText

This is a method more useful than multitext and it runs automatically. In simple, calling the method in a SVG Text elements finds an attribute 'data-text-id' in the element and tries to find a custom text with the attributes value and recreates the Text element with the found text and set attributes wrapping the text. 

The method is called automatically to every SVG Text element with data-text-id attribute on page enter and for content figure when it's loaded. The method doesn't take any parameters but it reads attributes from the Text element.

Here's what happens in the method:

​​Gives an id for the parent element if doesn't have one ("el-"+ NNNNNNNN)
Sets parent element id where new Text element will be appended to
Reads line height from attribute
Reads padding(s) from attribute
Read other attributes from element like font family, size, weight, fill color, ...
Read missing attributes from 1st span sub element it has font family, size, weight or fill color
Read width from attribute
If 'place after' element set, calculate a y position for new Text element
Call multitext with collected attributes
In addition to native Text element attributes setText method reads followind custom attributes:

data-text-id - id of a custom text for the new element, "txt1"
data-line-heigh - line height for new text, "1.2em"
data-text-width - width for new element, "200"
data-place-after - element the new element should be placed right below
Native Text element attributes

font-family​ - "'The Message'" or "Arial"
​​font-size - "20"
fill - "#DD9922​​"
font-weight - "600"
transform - "matrix(1 0 0 1 70 35)"​, optional
x - "20", optional
y - "40", optional
dx - "0", optional
dy - "16", optional
style​ - supports various value combinations, "font-size: 30px; text-anchor: start;", optional
​

​Bullet lists

Bullet lists are now supported in SVG texts by default, but GHP has a custom way make them. 

Simple way

Add a • in the text to start a new bullet. Line break is added automatically before new bullet so no <br> is needed. Bullet list needs to be ended to a <br>. Otherwise system can't know where last bullet ends.

Advanced way

Advanced way uses html tags. <ul> starts a list and </ul> ends it. No <br> is needed. List items can be defined in <li>....</li> or started with a •. Advanced way allows using <br>s inside list items forcing line breaks.

Common use case

A SVG is saved from a .AI layout. It has text that needs to be editable in admin and/or localized. At minimum you need to set the data-text-id attribute for eact Text element and set the equivalent custom text in admin. If original text's lines are saved separate Text elements, you should leave only the 1st and remove rest. The first one is used to place the new one and inherit it's attributes.