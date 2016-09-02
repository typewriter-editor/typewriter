# TODOs

* update the menu position on a selection AND change event

* Make the h4-headers become ::before/::after elements
* Create a minimal-updates algorithm so that instead of replacing an old block with a new version of it, only the
  minimum changes are made to it (e.g. class/attribute values, specific text nodes, etc.). This could just alter
  innerHTML and attributes when different. For animations the biggest thing (for now) is that the block element not be
  removed if not necessary (if the tagname doesn't change).
* One history for multiple editors, all editors on the current page should use it
* ~~Make it work inside the window it resides~~