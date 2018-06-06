/**
 * NOTES
 * 1st row of text elements expands always up when font size encreases. There's nothing to do about this calculating a fix seems impossible for different fonts, sizes (line heights?).
 */

define(['snap-svg'], function(Snap) {
    'use strict';
    Snap.plugin(function (Snap, Element, Paper) {

        Element.prototype.removeAttr = function( attr ) {
            return this.node.removeAttribute( attr );
        };
        Paper.prototype.drawPoint = function (x, y, radius, color) {
            radius = radius || 3;
            color = color || "red";
            var e = this.ellipse(x, y, radius, radius).attr("fill", color);
            return e;
        };
        Paper.prototype.drawBBox = function (bbox, strokeWidth, color) {
            strokeWidth = strokeWidth || 1;
            color = color || "black";
            var e = this.rect(bbox.x, bbox.y, bbox.x2-bbox.x, bbox.y2-bbox.y)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("strokeWidth", strokeWidth);
            return e;
        };
        Paper.prototype.getCloneBBox = function (element) {
            var svg = Snap();
            // add class to "virtual" svg to remove it later
            svg.addClass('svg-wrap-temp');

            var clone = element.clone();
            svg.append(clone);

            var BBox = clone.getBBox();

            clone.remove();
            svg.remove();

            return BBox;
        };

        Paper.prototype.multitext = function (BBox, txt, attributes) {

            if (txt) {

                var patt1 = /[\n\r]/g;				            // find \n, \r
                var patt2 = /<br(\s)*\/>/g;			            // find <br\>, <br \>
                var patt3 = /<(\/)?p>/g;			            // find <p>, </p>
                var patt4 = /<(br|ul|\/ul|li)>(?! )/g;			// find <br>_
                var patt5 = /([^\s])<(br|ul|\/ul|li)>/g;		// find _<br> or others
                var patt6 = /(<((?!br|ul|\/ul|li)[^>]+)>)/g;	// find other than <br>, <ul>, </ul>, <li>
                var patt7 = /&amp;/g;                           // find &amp;
                var patt8 = /&lt;/g;                            // find &lt;
                var patt9 = /&gt;/g;                            // find &gt;

                // make string replacements for unifying line breaks
                txt = txt.replace(patt1, "<br>");
                txt = txt.replace(patt2, "<br>");
                txt = txt.replace(patt3, "<br>");
                txt = txt.replace(patt4, "<$1> ");
                txt = txt.replace(patt5, "$1 <$2>");
                txt = txt.replace(patt6, "");
                txt = txt.replace(patt7, "&");
                txt = txt.replace(patt8, "<");
                txt = txt.replace(patt9, ">");

                var svg = Snap(),
                    words = txt.split(" "),			// split text to word array
                    lines = [],
                    line = "",
                    x = BBox.x,
                    y = BBox.y,
                    width = attributes['data-text-width'] || BBox.width,
                    height = BBox.height,
                    //origWidth = attributes["data-orig-width"] || width,
                    origHeight = attributes["data-orig-height"] || height,
                    textElattr = attributes,
                    dy = attributes.dy || 1,
                    padding = attributes.padding,
                    padTop = 0,
                    padRight = 0,
                    padBottom = 0,
                    padLeft = 0,
                    offsetX = 0,
                    offsetY = 0,
                    bullets = [],
                    indent = 0,
                    autoIndentSVGBullets = (window.viewModel) ? viewModel.training.dataContext.autoIndentSVGBullets: false,
                    addingBullet = false,
                    addingBulletList = false,       // Used when adding bullets insine <ul> tags. Allows using <br> in bullets.
                    basicIndentWidth = parseInt(attributes.indent) || 0,
                    indentTemp1 = svg.text(0, 0, "-• -").attr(attributes).getBBox().width,
                    indentTemp2 = svg.text(0, 0, "--").attr(attributes).getBBox().width,
                    extraIndentWidth = indentTemp1 - indentTemp2,
                    addLine = function(newLine, newIndent) {
                        line = line.trim();
                        if (line == "") {
                            line = " ";
                        }
                        lines.push(line +" ");          // adding space prevents FF issue with 'f' and 'i', GP-824
                        line = newLine;

                        indent = newIndent || indent;
                        if(addingBullet) {
                            bullets[bullets.length - 1].lines++;
                            indent = basicIndentWidth + extraIndentWidth;
                        }
                    };

                // add class to "virtual" svg to remove it later
                svg.addClass('svg-wrap-temp');

                if (padding) {
                    padTop = parseInt(padding[0]);
                    switch (padding.length) {
                        case 1:
                            padRight = parseInt(padding[0]);
                            padBottom = parseInt(padding[0]);
                            padLeft = parseInt(padding[0]);
                            break;
                        case 2:
                            padRight = parseInt(padding[1]);
                            padBottom = parseInt(padding[0]);
                            padLeft = parseInt(padding[1]);
                            break;
                        case 3:
                            padRight = parseInt(padding[1]);
                            padBottom = parseInt(padding[2]);
                            padLeft = parseInt(padding[1]);
                            break;
                        case 4:
                            padRight = parseInt(padding[1]);
                            padBottom = parseInt(padding[2]);
                            padLeft = parseInt(padding[3]);
                            break;
                    }
                    x += padLeft;
                    y += padTop;
                    width -= padLeft + padRight;
                    if (height) {
                        height -= padTop + padBottom;
                    }
                }
                // get X and Y offset values (FROM SVG with Text component)
                if (attributes['data-offset-x']) {
                    offsetX += parseInt(attributes["data-offset-x"]);
                }
                if (attributes['data-offset-y']) {
                    offsetY += parseInt(attributes["data-offset-y"]);
                }

                if(words[0] == "<br>") words.shift();   // remove <br> if first

                // divide text to lines (with lengths that fit)
                for (var i = 0; i < words.length; i++) {

                    // add line line to "virtual" SVG
                    var temp = svg.text(0, 0, line.replace(/\s/g, '\u00A0') + " " + (words[i] !== "" ? words[i] : "-")).attr(attributes);
                    var word = words[i];

                    if (word == "<ul>") {
                        addingBulletList = true;

                    }else if (word == "</ul>") {
                        addLine("", 0);
                        addingBulletList = false;
                        addingBullet = false;

                    }else if ((word == "•" && autoIndentSVGBullets) || word == "<li>") {
                        if(lines.length == 0 && line.trim() == "") {
                            line = "•";
                        }else{
                            addLine("•", basicIndentWidth);
                        }
                        bullets.push({startLineNumber: (lines.length + 1), lines: 0});
                        addingBullet = true;

                    }else if (word == "<br>" || word == "<br />" || word == "<br/>") {
                        // Add new empty line if word == <br>
                        addLine("");
                        if(addingBullet && !addingBulletList) {
                            // end bullet if not inside <ul>
                            addingBullet = false
                        }

                    } else {
                        var lineWidth = width - indent;

                        if (temp.getBBox().width > lineWidth) {
                            // line longer than text element
                            if(lines.length > 0 || line.trim() != "") {
                                addLine("")
                            }
                            // start new line with current word
                            line = word;
                        } else {
                            // new word fits to current line
                            if (line != "")
                                line += " ";
                            line += word;
                        }
                    }
                }
                addLine("");

                if (attributes["text-anchor"]) {
                    // if anchor (aling) set adjust x accordingly
                    if (attributes["text-anchor"] == "middle") {
                        x += width / 2;
                    } else if (attributes["text-anchor"] == "end") {
                        x += width;
                    }
                }
                textElattr.dy = "";

                if (attributes.id && (attributes.id.indexOf("-ml") != (attributes.id.length - 3))) {
                    attributes.id = attributes.id + "-ml";
                }

                x += offsetX;

                var t = this.text(x, 0, lines).attr(attributes);

                // Set line heights

                var tspans =  t.selectAll("tspan"),
                    dytemp = parseFloat(dy);

                for (var tspan=0;tspan<tspans.length;tspan++) {

                    // if empty rows, increase dy by one unit
                    if (tspans[tspan].node.innerHTML && tspans[tspan].node.innerHTML.trim() === "") {
                        dytemp += parseFloat(dy);
                    }

                    tspans[tspan].attr({
                        dy: parseFloat(dytemp) + "em",
                        x: x
                    });

                    // reset dy back to normal && trim leading and trailing whitespaces from tspans
                    if (tspans[tspan].node.innerHTML) tspans[tspan].node.innerHTML = tspans[tspan].node.innerHTML.trim();
                    if (tspans[tspan].node.innerHTML !== "") {
                        dytemp = parseFloat(dy);
                    }


                }

                // 1st line always 1em
                t.select("tspan").attr({
                    dy: "0em"
                });

                if(t.getBBox().height == 0){
                    svg.append(t);
                }

                if (attributes.vdirection == "both") {
                    y += (parseInt(origHeight) / 2) - (t.getBBox().height / 2);
                } else if (attributes.vdirection == "up") {
                    y += parseInt(origHeight) - t.getBBox().height;
                }

                t.attr({
                    y: y + offsetY
                });

                if(bullets.length > 0 && (attributes["text-anchor"] != "middle") && (attributes["text-anchor"] != "end")) {
                    for (var j = 0; j < bullets.length; j++) {
                        var bullet = bullets[j],
                            startLineNumber = parseInt(bullet.startLineNumber) || 0,
                            lineCount = bullet.lines;

                        t.select("tspan:nth-child("+ startLineNumber +")").attr({
                            dx: basicIndentWidth
                        });

                        for (var k = 1; k < lineCount; k++) {
                            t.select("tspan:nth-child("+ (startLineNumber + k) +")").attr({
                                dx: extraIndentWidth + basicIndentWidth
                            });
                        }
                    }
                }

                // Show bounding line
                if(!window.ghp) {		// For Gimlet
                    var lineId = attributes.id + "-line",
                        bbox = t.getBBox();

                    // remove ol
                    var olds = this.selectAll("." + lineId);
                    olds.forEach(function (old) {
                        old.remove();
                    });

                    if (attributes["text-anchor"] == "middle") {
                        var center = bbox.x + (bbox.x2 - bbox.x) / 2;

                        this.line(center - (width / 2), bbox.y, center - (width / 2), bbox.y2)
                            .attr("stroke", attributes["fill"] || "black")
                            .attr("class", lineId);

                        this.line(center + (width / 2), bbox.y, center + (width / 2), bbox.y2)
                            .attr("stroke", attributes["fill"] || "black")
                            .attr("class", lineId);

                    } else if (attributes["text-anchor"] == "end") {
                        this.line(bbox.x2 - width, bbox.y, bbox.x2 - width, bbox.y2)
                            .attr("stroke", attributes["fill"] || "black")
                            .attr("class", lineId);

                    } else {
                        this.line(bbox.x + width, bbox.y, bbox.x + width, bbox.y2)
                            .attr("stroke", attributes["fill"] || "black")
                            .attr("class", lineId);
                    }
                }

                if (attributes.parentElementId) {
                    var parEl = this.select('#' + attributes.parentElementId);
                    if (!parEl) {
                        parEl = this;
                    }
                    parEl.append(t);
                }

                svg.remove();

                $('.svg-wrap-temp').remove();
                setTimeout(function(){$('.svg-wrap-temp').remove();}, 1);	// MR: Timeout is somehow needed for some cases!
            }
            return t;
        };
        Element.prototype.initMultiLineAttr = function () {
            // Set orig width & height & 1 row height

            if(!this.attr('data-orig-height')){
                var BBox = this.getBBox();

                if(BBox.height == 0){
                    // Element not rendered yet, move text element to "virtual" paper (svg) to get proportions
                    BBox = this.paper.getCloneBBox(this);
                }
                this.attr('data-orig-height', BBox.height);
            }
        };
        Element.prototype.getFontSizePixels = function () {
            var fontSize = this.attr('font-size');
            if(!fontSize){
                fontSize = 16;
            }
            return parseInt(fontSize);
        };
        Element.prototype.getLineHeightPixels = function () {
            var lineHeight = this.attr('data-line-height');
            if(lineHeight){
                if(lineHeight.indexOf("em") > 0){
                    return parseInt(lineHeight) * this.getFontSizePixels();
                }else{
                    return parseInt(lineHeight);
                }
            }else{
                return this.getFontSizePixels();
            }
        };
        Element.prototype.setText = function (viewModel, _attributes) {
            _attributes = _attributes || {};

            var svg = Snap(),
                paper = this.paper,
                text = '',
                textID,
                BBox = this.getBBox(),
                attributes = {},
                lineHeight = this.attr("data-line-height") || "1em",
                padding = this.attr("data-padding") || "0",
                afterElementId = _attributes.placeAfter || this.attr("data-place-after"),
                t,
                tspan1 = this.select("tspan");

            // add class to "virtual" svg to remove it later
            svg.addClass('svg-wrap-temp');

            textID = this.attr("data-text-id") || this.attr("data-orig-text-id");

            if(BBox.height == 0){
                // Element not rendered yet, move text element to "virtual" paper (svg) to get proportions
                BBox = paper.getCloneBBox(this);
            }

            this.initMultiLineAttr();

            // Get text by id
            if (textID) {

                if(window.ghp){
                    // Used in GHP
                    text = _attributes.text || viewModel.training.customText(textID)[0];
                }else{
                    // Used in Fiddler or Gimlet admin
                    var txts = window.texts;
                    if(txts) {
                        text = txts[textID];
                    }else{
                        text = "error!";
                    }
                }

                if(text != undefined) {
                    if (!this.node.id) {
                        // set id if none
                        this.node.id = textID;
                    }

                    // use properties from function param if exists
                    if (_attributes.lineHeight) attributes["data-line-height"] = _attributes.lineHeight;
                    if (_attributes.size) attributes["font-size"] = _attributes.size;
                    if (_attributes.fontFamily) attributes["font-family"] = _attributes.fontFamily;
                    if (_attributes.weight) attributes["font-weight"] = _attributes.weight;
                    if (_attributes.anchor) attributes["text-anchor"] = _attributes.anchor;
                    if (_attributes.direction) attributes["vdirection"] = _attributes.direction;
                    if (_attributes.x) attributes["data-offset-x"] = _attributes.x;
                    if (_attributes.y) attributes["data-offset-y"] = _attributes.y;
                    if (_attributes.fill) attributes.fill = _attributes.fill;
                    if (_attributes.indent) attributes.indent = _attributes.indent;
                    if (_attributes.placeAfter) attributes["data-place-after"] = _attributes.placeAfter;

                    // set id to parent if none
                    if (!this.node.parentNode.id) {
                        this.node.parentNode.id = "el-" + Math.round(Math.random() * 1000000000);
                    }
                    attributes.parentElementId = this.node.parentNode.id;

                    // set for line height
                    attributes.dy = (_attributes.lineHeight) ? _attributes.lineHeight : lineHeight;
                    attributes.padding = _attributes.padding || eval("[" + padding + "]");

                    // use original element attributes if they provide new properties
                    for (var i = 0; i < this.node.attributes.length; i++) {
                        var nodeName = this.node.attributes[i].nodeName.toLowerCase();

                        if (nodeName != "data-text-id" || !window.ghp) {
                            // don't add data-text-id attr to new text element, so won't regenerate it again
                            // In gimlet admin add also data-text-id
                            if (nodeName == "style") {
                                // parse styles to own attributes
                                var styles = this.node.attributes[i].nodeValue.split(";");
                                for (var j = 0; j < styles.length; j++) {
                                    if (styles[j].length > 1) {
                                        var style = styles[j].trim().split(":");
                                        attributes[style[0].trim().toLowerCase()] = attributes[style[0].trim()] || style[1].trim();
                                    }
                                }
                            } else if (nodeName == "transform") {
                                attributes[nodeName] = attributes[nodeName] || this.node.attributes[i].nodeValue.split(" ").join(",");
                            } else {
                                attributes[nodeName] = attributes[nodeName] || this.node.attributes[i].nodeValue;
                            }
                        }else{
                            attributes["data-orig-text-id"] = attributes[nodeName] || this.node.attributes[i].nodeValue;
                        }
                    }

                    if (tspan1) {
                        // use 1st tspan attributes if it provide new properties
                        var tspan1Attrs = tspan1.node.attributes;
                        if (!attributes["font-family"] && tspan1Attrs["font-family"]) {
                            attributes["font-family"] = tspan1Attrs["font-family"].nodeValue;
                        }
                        if (!attributes["fill"] && tspan1Attrs["fill"]) {
                            attributes["fill"] = tspan1Attrs["fill"].nodeValue;
                        }
                        if (!attributes["font-weight"] && tspan1Attrs["font-weight"]) {
                            attributes["font-weight"] = tspan1Attrs["font-weight"].nodeValue;
                        }
                        if (!attributes["font-size"] && tspan1Attrs["font-size"]) {
                            attributes["font-size"] = tspan1Attrs["font-size"].nodeValue;
                        }
                    }
                    if (attributes["font-size"]) {
                        attributes["font-size"] = attributes["font-size"].replace("px", "");
                    }
                    var widthAttr = _attributes.width || parseInt(this.attr("data-text-width"));
                    if (widthAttr) {
                        attributes['data-text-width'] = widthAttr;
                    }

                    if(!attributes['data-orig-y']) attributes['data-orig-y'] = this.attr("y") || 0;
                    if(!attributes["data-orig-transform"]) attributes["data-orig-transform"] = attributes.transform;

                    if (afterElementId) {
                        // if after element set, calculate y based on it
                        // TODO: take account after el expand direction. If up then place this above it??
                        // Or add new param to define it
                        var afterElement = paper.root.select('#' + afterElementId + "-ml");
                        if (!afterElement) {
                            afterElement = paper.root.select('#' + afterElementId);
                        }
                        if (afterElement) {
                            var aEBBox = afterElement.getBBox();
                            var y = aEBBox.y;
                            if(aEBBox.height == 0){
                                // Element not rendered yet, move text element to "virtual" paper (svg) to get proportions
                                aEBBox = paper.getCloneBBox(afterElement);
                            }

                            if (attributes.vdirection == "up") {
                                y = aEBBox.y + aEBBox.height;
                            }else{
                                y = aEBBox.y + aEBBox.height + afterElement.getLineHeightPixels();
                            }

                            if (attributes["data-orig-transform"]) {
                                var mtrxArr = attributes["data-orig-transform"].split(",");
                                mtrxArr[5] = y + ")";
                                attributes.transform = mtrxArr.join(",");
                            } else {
                                attributes.y = y;
                            }

                            var updateAlso = afterElement.attr('data-update-also');
                            var id = (this.node.id.indexOf("-ml") != (this.node.id.length - 3)) ? this.node.id +"-ml": this.node.id;
                            if(!updateAlso){
                                // add attribute for updating linked text element
                                afterElement.attr('data-update-also', id)
                            }else{
                                // add this id to attribute for updating linked text elements
                                var updateAlsoIDs = updateAlso.split(",");
                                if($.inArray(id, updateAlsoIDs) < 0){
                                    updateAlsoIDs.push(id);
                                    afterElement.attr('data-update-also', updateAlsoIDs.join(","));
                                }
                            }
                        }
                    }

                    // X is not calculated from BBox
                    BBox.x = 0;
                    BBox.y = parseInt(attributes['data-orig-y']);

                    // Create new text element with given properties
                    t = paper.multitext(BBox, text, attributes);

                    var updateAlso2 = attributes['data-update-also'];

                    if(updateAlso2){
                        // update linked text elements
                        var updateAlsoIDs2 = updateAlso2.split(",");

                        updateAlsoIDs2.forEach(function (id) {
                            var textEls = paper.selectAll('#'+ id);
                            textEls.forEach(function (textEl) {
                                var myBoundMethod = (function (sProperty) {
                                    this.setText(sProperty);
                                }).bind(textEl);
                                setTimeout(myBoundMethod, 50, viewModel);			// Need to use bind to keep context in element + the 3rd param not supported in IE9, but...
                            });
                        });
                    }

                    // remove old text element
                    this.remove();

                    return t;
                }
            }
            svg.remove();
        };
    });

});
