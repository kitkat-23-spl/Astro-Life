/**
 * Browser translation (e.g. Google Translate) and some extensions replace
 * text nodes that React owns. React then crashes with "removeChild/insertBefore:
 * The node ... is not a child of this node" on the next navigation, which shows
 * up as a blank page. This widely used guard makes those two DOM calls
 * tolerant, so translated pages keep working.
 * See https://github.com/facebook/react/issues/11538
 */
export function installDomGuard() {
  if (typeof Node !== 'function' || !Node.prototype) return
  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child
    return originalRemoveChild.call(this, child) as T
  }
  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, ref: Node | null): T {
    if (ref && ref.parentNode !== this) return originalInsertBefore.call(this, newNode, null) as T
    return originalInsertBefore.call(this, newNode, ref) as T
  }
}
