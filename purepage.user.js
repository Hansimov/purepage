// ==UserScript==
// @name         PurePage
// @namespace    http://tampermonkey.net/
// @version      0.3.1
// @description  Purify webpage by filtering tags and classes
// @author       Hansimov
// @match        http://127.0.0.1:17777/*.html
// @icon         https://www.google.com/s2/favicons?sz=64&domain=0.1
// @grant        none
// @require      file:///E:/_codes/airead/purepage.user.js
// ==/UserScript==

// Informative Elements

const HEADER_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6"];
const TABLE_TAGS = ["table"];
const PRE_TAGS = ["pre"];
const BLOCKQUOTE_TAGS = ["blockquote"];
const IMG_TAGS = ["img"];
const CAPTION_TAGS = ["figcaption"];

const GROUP_TAGS = ["div", "section"];
const LIST_TAGS = ["ul", "ol"];
const DEF_TAGS = ["dl"];
const FIGURE_TAGS = ["figure"];

const P_TAGS = ["p"];
const LI_TAGS = ["li"];
const DD_TAGS = ["dt", "dd"];
const LINK_TAGS = ["a"];
const SPAN_TAGS = ["span"];

const MATH_TAGS = ["math"];
const CODE_TAGS = ["code"];

const ATOM_TAGS = [].concat(
    HEADER_TAGS,
    TABLE_TAGS,
    PRE_TAGS,
    BLOCKQUOTE_TAGS,
    IMG_TAGS,
    CAPTION_TAGS
);
const PARA_TAGS = [].concat(
    GROUP_TAGS,
    LIST_TAGS,
    DEF_TAGS,
    P_TAGS,
    LI_TAGS,
    DD_TAGS
);

const CUSTOM_CSS = `
.airead-info-element {
    border: 1px solid red !important;
    background-color: #ffcccc !important;
}
`;

// Removable Elements classes and ids

const COMMON_REMOVABLE_CLASSES = [
    "(?<!has)sidebar",
    "footer",
    "related",
    "comment",
    "topbar",
    "offcanvas",
    "navbar",
];
const WIKIPEDIA_REMOVABLE_CLASSES = [
    "(mw-)((jump-link)|(editsection)|(valign-text-top))",
    "language-list",
    "p-lang-btn",
    "(vector-)((header)|(column)|(sticky-pinned)|(dropdown-content)|(page-toolbar)|(body-before-content)|(settings))",
    "navbox",
    "catlinks",
    "side-box",
    "contentSub",
    "siteNotice",
];
const ARXIV_REMOVABLE_CLASSES = ["(ltx_)((flex_break)|(pagination))"];
const DOCS_PYTHON_REMOVABLE_CLASSES = ["clearer"];

const REMOVABLE_CLASSES = [].concat(
    COMMON_REMOVABLE_CLASSES,
    WIKIPEDIA_REMOVABLE_CLASSES,
    ARXIV_REMOVABLE_CLASSES,
    DOCS_PYTHON_REMOVABLE_CLASSES
);

// Helper Functions

function get_tag(element) {
    return element.tagName.toLowerCase();
}

function get_descendants(element) {
    return Array.from(element.querySelectorAll("*"));
}

function get_parents(element) {
    var parents = [];
    var parent = element.parentElement;
    while (parent) {
        parents.push(parent);
        parent = parent.parentElement;
    }
    return parents;
}

function is_elements_has_tags(elements, tags) {
    return elements.some((element) => tags.includes(get_tag(element)));
}

function is_class_id_match_pattern(element, pattern_str) {
    let pattern = new RegExp(pattern_str, "i");
    let parents = get_parents(element);
    let is_match =
        pattern.test(element.className) ||
        pattern.test(element.id) ||
        parents.some((parent) => pattern.test(parent.className)) ||
        parents.some((parent) => pattern.test(parent.id));
    return is_match;
}

// width of descendants means: max count of child elements per level
function calc_width_of_descendants(element) {
    let max_count = element.childElementCount;
    let descendants = get_descendants(element);
    for (let i = 0; i < descendants.length; i++) {
        let count = descendants[i].childElementCount;
        if (count > max_count) {
            max_count = count;
        }
    }
    return max_count;
}

// Main Classes

class ReadableElementsSelector {
    constructor() {}
    is_atomized(element) {
        const tag = get_tag(element);
        const descendants = get_descendants(element);
        const parents = get_parents(element);

        if (ATOM_TAGS.includes(tag)) {
            return !is_elements_has_tags(parents, ATOM_TAGS);
        }
        if (PARA_TAGS.includes(tag)) {
            const is_parent_has_atom = is_elements_has_tags(parents, ATOM_TAGS);
            const is_descendant_has_para = is_elements_has_tags(
                descendants,
                PARA_TAGS
            );
            // if descendant has atom, and descendant width is 1, then it is not atomized
            const is_descendant_has_only_atom =
                calc_width_of_descendants(element) == 1 &&
                is_elements_has_tags(descendants, ATOM_TAGS);

            return !(
                is_parent_has_atom ||
                is_descendant_has_para ||
                is_descendant_has_only_atom
            );
        }
        return false;
    }
    filter_atom_elements(elements) {
        let atomized_elements = [];
        for (let i = 0; i < elements.length; i++) {
            if (this.is_atomized(elements[i])) {
                atomized_elements.push(elements[i]);
            }
        }
        return atomized_elements;
    }

    filter_info_elements(elements) {
        let info_elements = elements;
        // if class+id of element+parents match any pattern in REMOVABLE_CLASSES, then remove it
        for (let i = 0; i < REMOVABLE_CLASSES.length; i++) {
            info_elements = info_elements.filter(
                (element) =>
                    !is_class_id_match_pattern(element, REMOVABLE_CLASSES[i])
            );
        }
        return info_elements;
    }

    add_style_to_reading_elements() {
        let reading_elements = get_descendants(document.body);
        reading_elements = this.filter_info_elements(reading_elements);
        reading_elements = this.filter_atom_elements(reading_elements);
        console.log("Reading elements count:", reading_elements.length);
        for (let i = 0; i < reading_elements.length; i++) {
            reading_elements[i].classList.add("airead-info-element");
        }
    }
}

// Main Function

(function () {
    "use strict";
    console.log("Plugin Loaded");

    let style_element = document.createElement("style");
    style_element.textContent = CUSTOM_CSS;
    document.head.appendChild(style_element);

    const selector = new ReadableElementsSelector();
    selector.add_style_to_reading_elements();
})();