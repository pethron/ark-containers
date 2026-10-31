module.exports = function downloads() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'mdxJsxTextElement' && node.name === 'a') {
        const asset = node.attributes.some((attribute) => attribute.name === 'data-noBrokenLinkCheck');
        const href = node.attributes.find((attribute) => attribute.name === 'href')?.value;
        if (asset && href?.type === 'mdxJsxAttributeValueExpression' && href.value.startsWith('require(')) {
          const statement = href.data.estree.body[0];
          // Docusaurus Link must treat Webpack downloads as files, not routes.
          href.value = `"pathname://" + (${href.value})`;
          statement.expression = {
            type: 'BinaryExpression',
            operator: '+',
            left: {type: 'Literal', value: 'pathname://', raw: '"pathname://"'},
            right: statement.expression,
          };
        }
      }
      for (const child of node.children ?? []) visit(child);
    }
    visit(tree);
  };
};
