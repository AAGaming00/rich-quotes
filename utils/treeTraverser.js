/**
 * Traverse a large object tree
 * @param {Object} o Object
 * @param {Array<String|String[]>} branches 
 */
module.exports = function traverseTree(o, branches) {
  let tree = o;
  for (const branch of branches) {
    if (Array.isArray(branch)) for (let i = 0; i < branch[1]; i++) {
      if (tree[branch[0]]) tree = tree[branch[0]];
      else return false;
    }
    else if (tree[branch]) tree = tree[branch];
    else return false;
  }
  return tree;
}