module.exports = Rect;

function Rect(clientRect) {
  this.left = clientRect.left;
  this.top = clientRect.top;
  this.width = clientRect.width;
  this.height = clientRect.height;
  this.right = clientRect.right;
  this.bottom = clientRect.bottom;
}
